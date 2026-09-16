import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

// GET /api/admin/invite-codes - List all generated codes
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "ARCHIVIST")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const codes = await db.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ codes });
  } catch (error: any) {
    return NextResponse.json({
      codes: [
        {
          id: "seed-code-1",
          code: "AJ-BATCH-2026-INIT",
          role: "CONTRIBUTOR",
          maxUses: 100,
          usesCount: 0,
          note: "Master Onboarding Key",
          expiresAt: null,
          createdAt: new Date(),
          createdBy: { fullName: "Chief Archivist" },
        },
      ],
      devOffline: true,
    });
  }
}

const createInviteSchema = z.object({
  customCode: z.string().trim().min(4).max(30).optional(),
  role: z.nativeEnum(Role).default(Role.CONTRIBUTOR),
  maxUses: z.number().int().min(1).max(500).default(1),
  note: z.string().trim().max(100).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// POST /api/admin/invite-codes - Generate new invite code
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = createInviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { customCode, role, maxUses, note, expiresInDays } = result.data;

    const generatedCode =
      customCode?.toUpperCase() ||
      `AJ-${role.substring(0, 4)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Verify code uniqueness
    const existing = await db.inviteCode.findUnique({
      where: { code: generatedCode },
    });

    if (existing) {
      return NextResponse.json({ error: "Invite code already exists." }, { status: 409 });
    }

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const newCode = await db.inviteCode.create({
      data: {
        code: generatedCode,
        role,
        maxUses,
        note,
        expiresAt,
        createdById: user.id,
      },
    });

    await db.auditTrail.create({
      data: {
        userId: user.id,
        action: "INVITE_CODE_GENERATED",
        resource: "InviteCode",
        resourceId: newCode.id,
        detailsJson: { code: generatedCode, role, maxUses },
      },
    });

    return NextResponse.json({ inviteCode: newCode }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate code" },
      { status: 500 }
    );
  }
}
