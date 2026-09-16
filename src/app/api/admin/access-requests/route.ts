import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listVaultAccessRequests, reviewVaultAccessRequest } from "@/lib/vaultData";
import { z } from "zod";

// GET /api/admin/access-requests - List pending, approved, or rejected member requests
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "ALL";

    const requests = listVaultAccessRequests(statusFilter);
    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch access requests" },
      { status: 500 }
    );
  }
}

const reviewSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

// POST /api/admin/access-requests - Approve (Accept) or Reject member request
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = reviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { requestId, action, rejectionReason } = result.data;

    const outcome = reviewVaultAccessRequest({
      requestId,
      action,
      reviewedById: user.id,
      rejectionReason,
    });

    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error || "Review action failed" }, { status: 400 });
    }

    return NextResponse.json({
      message: action === "APPROVE" ? "Member access approved" : "Request rejected",
      request: outcome.request,
      inviteCode: outcome.inviteCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process access request" },
      { status: 500 }
    );
  }
}
