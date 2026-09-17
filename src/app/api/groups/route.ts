import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GroupType } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters").max(60),
  description: z.string().trim().max(300).optional(),
  type: z.nativeEnum(GroupType).default(GroupType.CUSTOM),
  maxMembers: z.number().int().min(2).max(500).optional(),
});

// GET /api/groups - List all groups user has access to or can discover
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "my"; // "my" or "all"

    try {
      if (filter === "my") {
        // Return groups where user is owner or active member
        const userMemberships = await db.groupMember.findMany({
          where: {
            userId: user.id,
            status: "ACTIVE",
            group: { status: { not: "DELETED" } },
          },
          include: {
            group: {
              include: {
                owner: { select: { fullName: true, email: true } },
                _count: { select: { members: { where: { status: "ACTIVE" } } } },
              },
            },
          },
        });

        const groups = userMemberships.map((m) => ({
          ...m.group,
          myRole: m.role,
          memberCount: m.group._count.members,
        }));

        return NextResponse.json({ groups });
      }

      // "all" - Return active discovery groups
      const groups = await db.group.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { fullName: true, email: true } },
          _count: { select: { members: { where: { status: "ACTIVE" } } } },
          members: {
            where: { userId: user.id },
            select: { role: true, status: true },
          },
        },
      });

      const formatted = groups.map((g) => ({
        ...g,
        myRole: g.members[0]?.role || null,
        myMembershipStatus: g.members[0]?.status || null,
        memberCount: g._count.members,
      }));

      return NextResponse.json({ groups: formatted });
    } catch (dbErr) {
      // Fallback: Read groups directly from Git storage directory
      const fs = await import("fs");
      const path = await import("path");
      const storageRepoPath = path.resolve(process.cwd(), ".storage_repo", "groups");
      const gitGroups: any[] = [];

      if (fs.existsSync(storageRepoPath)) {
        const dirs = fs.readdirSync(storageRepoPath, { withFileTypes: true });
        for (const dir of dirs) {
          if (dir.isDirectory()) {
            const metaFile = path.join(storageRepoPath, dir.name, "group.json");
            if (fs.existsSync(metaFile)) {
              try {
                const meta = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
                gitGroups.push({
                  id: meta.id,
                  name: meta.name,
                  description: meta.description,
                  type: meta.type || "CUSTOM",
                  status: "ACTIVE",
                  memberCount: 1,
                  myRole: "OWNER",
                  createdAt: meta.createdAt || new Date().toISOString(),
                });
              } catch {}
            }
          }
        }
      }

      return NextResponse.json({ groups: gitGroups });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch groups" },
      { status: 500 }
    );
  }
}


// POST /api/groups - Create a new circle/group
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "VIEWER") {
      return NextResponse.json(
        { error: "Insufficient permissions: Viewers cannot create groups." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = createGroupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, type, maxMembers } = result.data;

    let newGroup: any = null;

    try {
      // Create group & attach creator as OWNER in a single transaction
      newGroup = await db.$transaction(async (tx) => {
        const group = await tx.group.create({
          data: {
            name,
            description,
            type,
            maxMembers,
            ownerId: user.id,
            isAdminManaged: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
          },
        });

        await tx.groupMember.create({
          data: {
            groupId: group.id,
            userId: user.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        });

        await tx.auditTrail.create({
          data: {
            userId: user.id,
            action: "GROUP_CREATED",
            resource: "Group",
            resourceId: group.id,
            detailsJson: { name, type },
          },
        });

        return group;
      });
    } catch (dbErr) {
      // Fallback object if database is currently offline
      console.warn("Database offline during group creation, persisting directly to Git Storage vault:", dbErr);
      newGroup = {
        id: crypto.randomUUID(),
        name,
        description: description || null,
        type,
        maxMembers: maxMembers || null,
        ownerId: user.id,
        isAdminManaged: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Version-control group folder structure & manifest in storage_gallery.git
    try {
      const { createGroupInStorage } = await import("@/lib/gitStorage");
      await createGroupInStorage({
        groupId: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        ownerName: user.fullName || "Archivist",
        type: newGroup.type,
      });
    } catch (gitErr: any) {
      console.warn("Notice: Git storage group sync note:", gitErr.message);
    }

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create group" },
      { status: 500 }
    );
  }
}

