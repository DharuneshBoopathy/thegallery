import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const inviteMemberSchema = z.object({
  email: z.string().email().toLowerCase(),
  role: z.enum(["MEMBER", "MODERATOR"]).default("MEMBER"),
});

// POST /api/groups/[id]/members - Invite or add a member to the group
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const body = await req.json();
    const result = inviteMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = result.data;

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { status: "ACTIVE" } },
      },
    });

    if (!group || group.status === "DELETED") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Permission check: Caller must be OWNER, MODERATOR, or ADMIN
    const callerMembership = group.members.find((m) => m.userId === user.id);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const canInvite = isAdmin || callerMembership?.role === "OWNER" || callerMembership?.role === "MODERATOR";

    if (!canInvite) {
      return NextResponse.json(
        { error: "Forbidden: Only group owners, moderators, or admins can add members." },
        { status: 403 }
      );
    }

    // Check capacity limit
    if (group.maxMembers && group.members.length >= group.maxMembers) {
      return NextResponse.json(
        { error: `Group has reached its maximum capacity of ${group.maxMembers} members.` },
        { status: 400 }
      );
    }

    // Find recipient user
    const recipientUser = await db.user.findUnique({
      where: { email },
    });

    if (!recipientUser) {
      return NextResponse.json(
        { error: "No member found with this email. Member must be registered first." },
        { status: 404 }
      );
    }

    // Check if membership already exists
    const existingMembership = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: recipientUser.id,
        },
      },
    });

    if (existingMembership && existingMembership.status === "ACTIVE") {
      return NextResponse.json(
        { error: "User is already an active member of this group." },
        { status: 409 }
      );
    }

    // Add or activate member
    const membership = await db.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: recipientUser.id,
        },
      },
      update: {
        status: "ACTIVE",
        role,
        joinedAt: new Date(),
        invitedById: user.id,
      },
      create: {
        groupId,
        userId: recipientUser.id,
        role,
        status: "ACTIVE",
        invitedById: user.id,
      },
    });

    await db.auditTrail.create({
      data: {
        userId: user.id,
        action: "GROUP_MEMBER_ADDED",
        resource: "GroupMember",
        resourceId: membership.id,
        detailsJson: { groupId, addedUserId: recipientUser.id, role },
      },
    });

    return NextResponse.json({
      message: `Added ${recipientUser.fullName} to group`,
      membership,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add member" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/members - Remove a member or leave group
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user.id; // Self-leave if no userId provided

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { status: "ACTIVE" } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const callerMembership = group.members.find((m) => m.userId === user.id);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = targetUserId === user.id;

    // Permissions: Can remove if self-leaving OR caller is owner/moderator/admin
    const canRemove =
      isSelf ||
      isAdmin ||
      callerMembership?.role === "OWNER" ||
      callerMembership?.role === "MODERATOR";

    if (!canRemove) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to remove this member." },
        { status: 403 }
      );
    }

    // Prevent removing the group owner unless transferring ownership first
    if (group.ownerId === targetUserId && !isAdmin) {
      return NextResponse.json(
        { error: "Group owner cannot leave without transferring ownership first." },
        { status: 400 }
      );
    }

    await db.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
      data: {
        status: isSelf ? "LEFT" : "REMOVED",
      },
    });

    await db.auditTrail.create({
      data: {
        userId: user.id,
        action: isSelf ? "GROUP_MEMBER_LEFT" : "GROUP_MEMBER_REMOVED",
        resource: "GroupMember",
        resourceId: `${groupId}-${targetUserId}`,
      },
    });

    return NextResponse.json({
      message: isSelf ? "You have left the group" : "Member removed successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}
