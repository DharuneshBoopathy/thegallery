import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveMediaToGitStorage } from "@/lib/gitStorage";
import { ALLOWED_MIME_TYPES } from "@/lib/storage";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "VIEWER") {
      return NextResponse.json(
        { error: "Insufficient permissions: Viewers cannot deposit media." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const groupId = (formData.get("groupId") as string) || undefined;
    const visibilityMode = (formData.get("visibilityMode") as string) || "PUBLIC_BATCH";
    const allowedGender = (formData.get("allowedGender") as any) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    const filename = file.name || "media";

    // Validate size (50MB photo, 2GB video)
    const isVideo = mimeType.startsWith("video/");
    const maxBytes = isVideo ? 2 * 1024 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of ${isVideo ? "2GB" : "50MB"}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Look up group name if groupId provided
    let groupName: string | undefined;
    if (groupId) {
      try {
        const group = await db.group.findUnique({ where: { id: groupId } });
        if (group) groupName = group.name;
      } catch {}
    }

    // Save directly to storage_gallery.git
    const stored = await saveMediaToGitStorage({
      buffer,
      originalFilename: filename,
      mimeType,
      groupId,
      groupName,
      uploaderName: user.fullName,
      visibilityMode,
    });

    const assetId = crypto.randomUUID();

    // Persist asset in database if reachable
    try {
      await db.mediaAsset.create({
        data: {
          id: assetId,
          storageKey: stored.storageKey,
          originalFilename: filename,
          mimeType,
          fileSizeBytes: BigInt(stored.fileSizeBytes),
          sha256Hash: stored.sha256Hash,
          uploaderId: user.id,
          status: "READY",
          visibilityMode: visibilityMode as any,
          groupId: groupId || null,
          allowedGender: allowedGender || null,
          width: stored.width || null,
          height: stored.height || null,
          variants: stored.thumbnailKey
            ? {
                create: [
                  {
                    variantType: "THUMBNAIL_MD",
                    storageKey: stored.thumbnailKey,
                    mimeType: "image/webp",
                    fileSizeBytes: BigInt(buffer.length),
                    width: stored.width,
                    height: stored.height,
                  },
                ],
              }
            : undefined,
        },
      });

      await db.auditTrail.create({
        data: {
          userId: user.id,
          action: "MEDIA_UPLOADED",
          resource: "MediaAsset",
          resourceId: assetId,
          detailsJson: {
            filename,
            storageKey: stored.storageKey,
            thumbnailKey: stored.thumbnailKey,
            groupId,
            sizeBytes: stored.fileSizeBytes,
          },
        },
      });
    } catch (dbErr) {
      console.warn("Database offline during asset index, file preserved in Git storage vault:", dbErr);
    }

    return NextResponse.json({
      success: true,
      assetId,
      storageKey: stored.storageKey,
      thumbnailKey: stored.thumbnailKey,
      message: "Asset deposited into Git storage vault",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process media upload" },
      { status: 500 }
    );
  }
}
