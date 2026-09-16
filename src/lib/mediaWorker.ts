import { db } from "@/lib/db";
import { getObjectBuffer, putObjectBuffer } from "@/lib/storage";
import sharp from "sharp";
import exifParser from "exif-parser";

export interface ProcessMediaResult {
  assetId: string;
  width?: number;
  height?: number;
  capturedAt?: Date;
  deviceMake?: string;
  deviceModel?: string;
  variantsCreated: number;
}

/**
 * Background Media Processing Pipeline
 * 1. Fetches raw image from storage
 * 2. Parses EXIF data (Date, Camera Make/Model, dimensions)
 * 3. Sanitizes EXIF (strips GPS and personal hardware identifiers)
 * 4. Generates multi-resolution WebP derivatives:
 *    - THUMBNAIL_SM (320px width)
 *    - THUMBNAIL_MD (640px width)
 *    - THUMBNAIL_LG (1280px width)
 *    - OPTIMIZED_WEBP (2048px max bounding box)
 * 5. Saves variants to storage and records them in the database
 * 6. Marks asset as READY
 */
export async function processImageAsset(assetId: string): Promise<ProcessMediaResult> {
  const asset = await db.mediaAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error(`Asset ${assetId} not found`);
  }

  // 1. Download buffer from storage
  const rawBuffer = await getObjectBuffer(asset.storageKey);

  // 2. Parse EXIF safely
  let capturedAt: Date | undefined = asset.capturedAt || undefined;
  let deviceMake: string | undefined = asset.deviceMake || undefined;
  let deviceModel: string | undefined = asset.deviceModel || undefined;

  try {
    const parser = exifParser.create(rawBuffer);
    const parsed = parser.parse();

    if (parsed.tags) {
      if (!capturedAt && parsed.tags.DateTimeOriginal) {
        capturedAt = new Date(parsed.tags.DateTimeOriginal * 1000);
      }
      if (!deviceMake && parsed.tags.Make) {
        deviceMake = String(parsed.tags.Make).trim();
      }
      if (!deviceModel && parsed.tags.Model) {
        deviceModel = String(parsed.tags.Model).trim();
      }
    }
  } catch (err) {
    // If EXIF parsing fails, continue to image metadata extraction
    console.warn(`EXIF parse skipped for ${assetId}:`, err);
  }

  // 3. Sharp processing & metadata
  const image = sharp(rawBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || undefined;
  const height = metadata.height || undefined;

  // 4. Generate variants
  const variantsToGenerate = [
    { type: "THUMBNAIL_SM" as const, width: 320, quality: 75 },
    { type: "THUMBNAIL_MD" as const, width: 640, quality: 80 },
    { type: "THUMBNAIL_LG" as const, width: 1280, quality: 85 },
    { type: "OPTIMIZED_WEBP" as const, width: 2048, quality: 88 },
  ];

  let variantsCount = 0;
  const basePath = asset.storageKey.substring(0, asset.storageKey.lastIndexOf("."));

  for (const v of variantsToGenerate) {
    // Skip upscale if original is smaller than target
    if (width && width < v.width && v.type !== "THUMBNAIL_SM") {
      continue;
    }

    const variantKey = `${basePath}_${v.type.toLowerCase()}.webp`;

    // Resize and strip all metadata (GPS, serials) for privacy
    const variantBuffer = await sharp(rawBuffer)
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality })
      .toBuffer();

    // Upload derivative to object storage
    await putObjectBuffer(variantKey, variantBuffer, "image/webp");

    // Upsert variant record in database
    await db.mediaVariant.upsert({
      where: {
        assetId_variantType: {
          assetId: asset.id,
          variantType: v.type,
        },
      },
      update: {
        storageKey: variantKey,
        fileSizeBytes: BigInt(variantBuffer.length),
        width: v.width,
        mimeType: "image/webp",
      },
      create: {
        assetId: asset.id,
        variantType: v.type,
        storageKey: variantKey,
        fileSizeBytes: BigInt(variantBuffer.length),
        width: v.width,
        mimeType: "image/webp",
      },
    });

    variantsCount++;
  }

  // 5. Update parent asset status to READY
  const captureYear = capturedAt ? capturedAt.getUTCFullYear() : asset.captureYear;

  await db.mediaAsset.update({
    where: { id: assetId },
    data: {
      status: "READY",
      width,
      height,
      capturedAt,
      captureYear,
      deviceMake,
      deviceModel,
    },
  });

  return {
    assetId,
    width,
    height,
    capturedAt,
    deviceMake,
    deviceModel,
    variantsCreated: variantsCount,
  };
}
