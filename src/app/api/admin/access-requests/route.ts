import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

// GET /api/admin/access-requests - List pending, approved, or rejected requests
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "ARCHIVIST")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "PENDING";

    const requests = await db.accessRequest.findMany({
      where: statusFilter === "ALL" ? {} : { status: statusFilter as any },
      orderBy: { createdAt: "desc" },
      include: {
        reviewedBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch access requests" },
      { status: 500 }
    );
  }
}

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

// POST /api/admin/access-requests - Approve or Reject request
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

    const accessReq = await db.accessRequest.findUnique({
      where: { id: requestId },
    });

    if (!accessReq) {
      return NextResponse.json({ error: "Access request not found" }, { status: 404 });
    }

    if (accessReq.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request has already been marked as ${accessReq.status}` },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const updated = await db.accessRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById: user.id,
          rejectionReason: rejectionReason || "Verification criteria not met",
        },
      });

      await db.auditTrail.create({
        data: {
          userId: user.id,
          action: "ACCESS_REQUEST_REJECTED",
          resource: "AccessRequest",
          resourceId: accessReq.id,
          detailsJson: { email: accessReq.email, reason: rejectionReason },
        },
      });

      return NextResponse.json({ message: "Request rejected", request: updated });
    }

    // ACTION: APPROVE
    // Automatically generate a single-use onboarding invite code bound for this member
    const autoCode = `AJ-APPROVED-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const { inviteCode, updatedRequest } = await db.$transaction(async (tx) => {
      const code = await tx.inviteCode.create({
        data: {
          code: autoCode,
          role: "CONTRIBUTOR",
          maxUses: 1,
          createdById: user.id,
          note: `Auto-generated for approved applicant: ${accessReq.fullName} (${accessReq.email})`,
        },
      });

      const updated = await tx.accessRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
        },
      });

      await tx.auditTrail.create({
        data: {
          userId: user.id,
          action: "ACCESS_REQUEST_APPROVED",
          resource: "AccessRequest",
          resourceId: accessReq.id,
          detailsJson: {
            email: accessReq.email,
            generatedInviteCode: autoCode,
          },
        },
      });

      return { inviteCode: code, updatedRequest: updated };
    });

    return NextResponse.json({
      message: "Request approved and single-use onboarding code generated",
      inviteCode: inviteCode.code,
      request: updatedRequest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to review access request" },
      { status: 500 }
    );
  }
}
