import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(300).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

// GET /api/groups/[id] - Get details and members of a group
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const group = await db.group.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!group || group.status === "DELETED") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check caller membership
    const callerMembership = group.members.find((m) => m.userId === user.id);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    return NextResponse.json({
      group,
      callerRole: callerMembership?.role || null,
      isMember: !!callerMembership,
      canManage: isAdmin || callerMembership?.role === "OWNER" || callerMembership?.role === "MODERATOR",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve group" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id] - Edit group metadata
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateGroupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const group = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: user.id, status: "ACTIVE" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const callerMembership = group.members[0];
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const canManage = isAdmin || callerMembership?.role === "OWNER" || callerMembership?.role === "MODERATOR";

    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this group." },
        { status: 403 }
      );
    }

    const updated = await db.group.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ group: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Soft delete group (Admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Only administrators can delete groups." }, { status: 403 });
    }

    const { id } = await params;

    const group = await db.group.update({
      where: { id },
      data: { status: "DELETED" },
    });

    await db.auditTrail.create({
      data: {
        userId: user.id,
        action: "GROUP_DELETED",
        resource: "Group",
        resourceId: id,
      },
    });

    return NextResponse.json({ message: "Group soft-deleted", group });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete group" },
      { status: 500 }
    );
  }
}
