import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyObjectExists } from "@/lib/storage";
import { z } from "zod";

const completeSchema = z.object({
  assetId: z.string().uuid(),
  capturedAt: z.string().datetime().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().optional(),
  deviceMake: z.string().optional(),
  deviceModel: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = completeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { assetId, capturedAt, width, height, durationSeconds, deviceMake, deviceModel } = result.data;

    const asset = await db.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Must be uploader or admin
    if (asset.uploaderId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify file actually reached storage
    const storageVerification = await verifyObjectExists(asset.storageKey);
    if (!storageVerification.exists) {
      return NextResponse.json(
        { error: "Object not found in storage. Upload may have failed or timed out." },
        { status: 400 }
      );
    }

    // Parse capture year if capturedAt is provided
    let captureYear: number | null = null;
    let parsedCapturedAt: Date | null = null;
    if (capturedAt) {
      parsedCapturedAt = new Date(capturedAt);
      captureYear = parsedCapturedAt.getUTCFullYear();
    }

    // Update asset record to PROCESSING (or READY for immediate consumption)
    const updatedAsset = await db.mediaAsset.update({
      where: { id: assetId },
      data: {
        status: "PROCESSING", // Ready for background transcoding/derivatives pipeline
        capturedAt: parsedCapturedAt,
        captureYear,
        width,
        height,
        durationSeconds,
        deviceMake,
        deviceModel,
        fileSizeBytes: storageVerification.contentLength
          ? BigInt(storageVerification.contentLength)
          : asset.fileSizeBytes,
      },
    });

    // Create audit log
    await db.auditTrail.create({
      data: {
        userId: user.id,
        action: "MEDIA_UPLOADED",
        resource: "MediaAsset",
        resourceId: asset.id,
        detailsJson: {
          filename: asset.originalFilename,
          storageKey: asset.storageKey,
          sizeBytes: storageVerification.contentLength,
        },
      },
    });

    // Trigger background image derivative processing if mime type is image
    if (asset.mimeType.startsWith("image/")) {
      try {
        const { processImageAsset } = await import("@/lib/mediaWorker");
        await processImageAsset(asset.id);
      } catch (workerErr) {
        console.error("Image processing error (falling back to raw):", workerErr);
      }
    }

    const finalAsset = await db.mediaAsset.findUnique({
      where: { id: assetId },
      include: { variants: true },
    });

    return NextResponse.json({
      message: "Asset upload confirmed and indexed",
      asset: {
        id: finalAsset?.id || updatedAsset.id,
        status: finalAsset?.status || updatedAsset.status,
        filename: finalAsset?.originalFilename || updatedAsset.originalFilename,
        variantsCount: finalAsset?.variants.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
