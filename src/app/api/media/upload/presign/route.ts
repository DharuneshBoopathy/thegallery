import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPresignedUploadUrl, ALLOWED_MIME_TYPES } from "@/lib/storage";
import { z } from "zod";
import crypto from "crypto";

const presignSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string(),
  fileSizeBytes: z.number().positive(),
  sha256Hash: z.string().optional(),
  visibilityMode: z
    .enum([
      "PUBLIC_BATCH",
      "GROUP_ONLY",
      "GENDER_RESTRICTED",
      "GROUP_AND_GENDER",
      "SPECIFIC_USERS",
      "PRIVATE_CREATOR",
    ])
    .default("PUBLIC_BATCH"),
  allowedGender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).optional(),
  groupId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role gate: VIEWER cannot upload
    if (user.role === "VIEWER") {
      return NextResponse.json(
        { error: "Insufficient permissions: Viewers cannot upload media." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = presignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, mimeType, fileSizeBytes, sha256Hash, visibilityMode, allowedGender, groupId } = result.data;

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported media type: ${mimeType}` },
        { status: 400 }
      );
    }

    // Size limit enforcement (50MB photo, 2GB video)
    const isVideo = mimeType.startsWith("video/");
    const maxBytes = isVideo ? 2 * 1024 * 1024 * 1024 : 50 * 1024 * 1024;
    if (fileSizeBytes > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of ${isVideo ? "2GB" : "50MB"}` },
        { status: 400 }
      );
    }

    // Check duplicate hash if provided
    if (sha256Hash) {
      const existing = await db.mediaAsset.findUnique({
        where: { sha256Hash },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: "DUPLICATE_ASSET: An identical file is already stored in the archive.",
            existingAssetId: existing.id,
          },
          { status: 409 }
        );
      }
    }

    // Generate unique storage path: raw/{year}/{month}/{random-uuid}-{sanitized-filename}
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const uniqueId = crypto.randomUUID();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `raw/${year}/${month}/${uniqueId}/${safeFilename}`;

    // Get presigned URL
    const { uploadUrl } = await createPresignedUploadUrl({
      storageKey,
      mimeType,
      expiresInSeconds: 900,
    });

    // Create database asset in PENDING_UPLOAD state with visibility controls
    const asset = await db.mediaAsset.create({
      data: {
        storageKey,
        originalFilename: filename,
        mimeType,
        fileSizeBytes: BigInt(fileSizeBytes),
        sha256Hash: sha256Hash || null,
        uploaderId: user.id,
        status: "PENDING_UPLOAD",
        visibilityMode,
        allowedGender: allowedGender || null,
        groupId: groupId || null,
      },
    });

    return NextResponse.json({
      assetId: asset.id,
      storageKey,
      uploadUrl,
      expiresInSeconds: 900,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate presigned upload" },
      { status: 500 }
    );
  }
}
