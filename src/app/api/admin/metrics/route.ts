import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/metrics - Global vault summary statistics & storage breakdown
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalUsers,
      activeUsers,
      totalAssets,
      totalVariants,
      accessRequestsCount,
      deletionRequestsCount,
      assetsSizeAgg,
      variantsSizeAgg,
      recentUploads,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.mediaAsset.count({ where: { status: "READY", isArchived: false } }),
      db.mediaVariant.count(),
      db.accessRequest.count({ where: { status: "PENDING" } }),
      db.deletionRequest.count({ where: { status: "PENDING" } }),
      db.mediaAsset.aggregate({
        _sum: { fileSizeBytes: true },
        where: { isArchived: false },
      }),
      db.mediaVariant.aggregate({
        _sum: { fileSizeBytes: true },
      }),
      db.mediaAsset.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          uploader: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    const rawSizeBytes = assetsSizeAgg._sum.fileSizeBytes || BigInt(0);
    const variantsSizeBytes = variantsSizeAgg._sum.fileSizeBytes || BigInt(0);
    const totalStorageBytes = rawSizeBytes + variantsSizeBytes;

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeUsers,
        totalAssets,
        totalVariants,
        pendingAccessRequests: accessRequestsCount,
        pendingDeletionRequests: deletionRequestsCount,
        storage: {
          rawBytes: rawSizeBytes.toString(),
          variantsBytes: variantsSizeBytes.toString(),
          totalBytes: totalStorageBytes.toString(),
        },
      },
      recentUploads: recentUploads.map((asset) => ({
        id: asset.id,
        filename: asset.originalFilename,
        mimeType: asset.mimeType,
        sizeBytes: asset.fileSizeBytes.toString(),
        uploader: asset.uploader.fullName,
        status: asset.status,
        visibilityMode: asset.visibilityMode,
        createdAt: asset.createdAt,
      })),
    });
  } catch (error: any) {
    // Provide offline demonstration metrics when database is offline
    return NextResponse.json({
      metrics: {
        totalUsers: 1,
        activeUsers: 1,
        totalAssets: 0,
        totalVariants: 0,
        pendingAccessRequests: 0,
        pendingDeletionRequests: 0,
        storage: {
          rawBytes: "0",
          variantsBytes: "0",
          totalBytes: "0",
        },
      },
      recentUploads: [],
      devOffline: true,
    });
  }
}
