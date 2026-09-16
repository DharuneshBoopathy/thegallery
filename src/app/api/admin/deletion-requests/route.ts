import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteStorageObject } from "@/lib/storage";
import { z } from "zod";

// GET /api/admin/deletion-requests - List pending, approved, or rejected deletion requests
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const requests = await db.deletionRequest.findMany({
      where: status === "ALL" ? {} : { status: status as any },
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { fullName: true, email: true } },
        reviewedBy: { select: { fullName: true } },
        asset: {
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            storageKey: true,
            status: true,
            variants: { select: { storageKey: true } },
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch deletion requests" },
      { status: 500 }
    );
  }
}

const createRequestSchema = z.object({
  assetId: z.string().uuid(),
  reason: z.string().trim().min(5, "Please provide a reason for deletion").max(300),
});

// POST /api/admin/deletion-requests - Member initiates deletion request on their media
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { assetId, reason } = result.data;

    const asset = await db.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Verify member is the uploader or admin
    const isUploader = asset.uploaderId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isUploader && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You can only request deletion of media you uploaded." },
        { status: 403 }
      );
    }

    // Two-Man Rule: Calculate 14-day grace period (PRD Section 26)
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 14);

    // Transaction: Create deletion request & soft-hide media from gallery feeds
    const deletionRequest = await db.$transaction(async (tx) => {
      const request = await tx.deletionRequest.create({
        data: {
          assetId,
          requesterId: user.id,
          reason,
          gracePeriodEnds,
          status: "PENDING",
        },
      });

      await tx.mediaAsset.update({
        where: { id: assetId },
        data: {
          status: "PENDING_DELETION", // Immediately hides from public feeds
        },
      });

      await tx.auditTrail.create({
        data: {
          userId: user.id,
          action: "MEDIA_DELETION_REQUESTED",
          resource: "MediaAsset",
          resourceId: asset.id,
          detailsJson: { reason, gracePeriodEnds },
        },
      });

      return request;
    });

    return NextResponse.json(
      {
        message: "Deletion request submitted. Media hidden from archive feed pending administrator review.",
        deletionRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit deletion request" },
      { status: 500 }
    );
  }
}

const reviewDeletionSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

// PATCH /api/admin/deletion-requests - Review and purge media
export async function PATCH(req: Request) {
  try {
    const caller = await getSessionUser();
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = reviewDeletionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { requestId, action, rejectionReason } = result.data;

    const request = await db.deletionRequest.findUnique({
      where: { id: requestId },
      include: {
        asset: {
          include: { variants: true },
        },
      },
    });

    if (!request || request.status !== "PENDING") {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }

    // Two-Man Rule Invariant: The approving administrator CANNOT be the requester
    // unless caller is SUPER_ADMIN performing emergency administrative purge
    if (request.requesterId === caller.id && caller.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "TWO_MAN_RULE_VIOLATION: A second independent administrator must approve this deletion.",
        },
        { status: 403 }
      );
    }

    if (action === "REJECT") {
      await db.$transaction(async (tx) => {
        await tx.deletionRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            reviewedById: caller.id,
            rejectionReason: rejectionReason || "Deletion denied by administrator",
          },
        });

        // Restore media asset back to READY
        await tx.mediaAsset.update({
          where: { id: request.assetId },
          data: { status: "READY" },
        });

        await tx.auditTrail.create({
          data: {
            userId: caller.id,
            action: "MEDIA_DELETION_REJECTED",
            resource: "MediaAsset",
            resourceId: request.assetId,
            detailsJson: { rejectionReason },
          },
        });
      });

      return NextResponse.json({ message: "Deletion request rejected. Media restored to archive." });
    }

    // ACTION: APPROVE - Permanently purge binary objects from S3/R2 storage
    const keysToDelete = [
      request.asset.storageKey,
      ...request.asset.variants.map((v) => v.storageKey),
    ];

    for (const key of keysToDelete) {
      try {
        await deleteStorageObject(key);
      } catch (storageErr) {
        console.warn(`Failed to delete object key ${key} from storage:`, storageErr);
      }
    }

    // Soft-delete database asset record (status: DELETED) to preserve immutable audit trail
    await db.$transaction(async (tx) => {
      await tx.deletionRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: caller.id,
        },
      });

      await tx.mediaAsset.update({
        where: { id: request.assetId },
        data: {
          status: "DELETED",
          isArchived: true,
        },
      });

      await tx.auditTrail.create({
        data: {
          userId: caller.id,
          action: "MEDIA_DELETED_PERMANENT",
          resource: "MediaAsset",
          resourceId: request.assetId,
          detailsJson: {
            originalFilename: request.asset.originalFilename,
            purgedKeys: keysToDelete,
            requesterId: request.requesterId,
            approverId: caller.id,
          },
        },
      });
    });

    return NextResponse.json({
      message: "Media permanently purged from storage and recorded in audit log.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process deletion" },
      { status: 500 }
    );
  }
}
