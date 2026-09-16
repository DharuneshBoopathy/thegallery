import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

// GET /api/admin/users - List users with roles and status
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const users = await db.user.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        gender: true,
        isGenderLocked: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { uploadedAssets: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({
      users: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          fullName: "Chief Archivist",
          email: "admin@autisticjourney.local",
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          gender: "PREFER_NOT_TO_SAY",
          isGenderLocked: true,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          _count: { uploadedAssets: 0 },
        },
      ],
      devOffline: true,
    });
  }
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

// PATCH /api/admin/users - Adjust role or suspend/activate user
export async function PATCH(req: Request) {
  try {
    const caller = await getSessionUser();
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, role, status } = result.data;

    // Prevent modifying own account
    if (userId === caller.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify your own administrative role or status." },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Regular admin cannot demote or alter a SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN" && caller.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admins can alter a Super Admin account." },
        { status: 403 }
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        role: role || undefined,
        status: status || undefined,
      },
    });

    await db.auditTrail.create({
      data: {
        userId: caller.id,
        action: "USER_MODIFIED_BY_ADMIN",
        resource: "User",
        resourceId: targetUser.id,
        detailsJson: {
          targetEmail: targetUser.email,
          newRole: role,
          newStatus: status,
        },
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
