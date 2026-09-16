import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listVaultInviteCodes, createVaultInviteCode } from "@/lib/vaultData";
import { z } from "zod";

// GET /api/admin/invite-codes - List all generated codes
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const codes = listVaultInviteCodes();
    return NextResponse.json({
      codes: codes.map((c) => ({
        ...c,
        createdBy: { fullName: user.fullName || "Chief Archivist" },
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch invite codes" },
      { status: 500 }
    );
  }
}

const createInviteSchema = z.object({
  customCode: z.string().trim().min(3).max(30).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MEMBER", "CONTRIBUTOR", "VIEWER"]).default("MEMBER"),
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

    const newCode = createVaultInviteCode({
      code: customCode,
      role: role as any,
      maxUses,
      note,
      expiresInDays,
      createdById: user.id,
    });

    return NextResponse.json({ inviteCode: newCode }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate code" },
      { status: 500 }
    );
  }
}
