import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.STORAGE_ENDPOINT;
const region = process.env.STORAGE_REGION || "auto";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY || "";
export const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "thegallery-storage-vault";
export const PUBLIC_STORAGE_URL = process.env.STORAGE_PUBLIC_URL || "";

export const s3Client = new S3Client({
  region,
  endpoint: endpoint ? endpoint : undefined,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Required for MinIO / self-hosted S3 compatibility
});

export const ALLOWED_MIME_TYPES = new Set([
  // Photos
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
  // Videos
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
]);

export interface PresignUploadParams {
  storageKey: string;
  mimeType: string;
  expiresInSeconds?: number;
}

export async function createPresignedUploadUrl({
  storageKey,
  mimeType,
  expiresInSeconds = 900,
}: PresignUploadParams): Promise<{ uploadUrl: string; storageKey: string }> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`MIME type '${mimeType}' is not supported for archival storage.`);
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, storageKey };
}

import {
  getGitStorageBuffer,
  gitStorageObjectExists,
  deleteGitStorageObject,
} from "./gitStorage";

export async function verifyObjectExists(storageKey: string): Promise<{
  exists: boolean;
  contentLength?: number;
  contentType?: string;
  etag?: string;
}> {
  // 1. Check Git Storage Vault first
  if (await gitStorageObjectExists(storageKey)) {
    const { buffer } = await getGitStorageBuffer(storageKey);
    return {
      exists: true,
      contentLength: buffer.length,
      contentType: storageKey.endsWith(".webp")
        ? "image/webp"
        : storageKey.endsWith(".mp4")
        ? "video/mp4"
        : "image/jpeg",
    };
  }

  // 2. Fallback to S3 if configured
  try {
    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
      })
    );
    return {
      exists: true,
      contentLength: head.ContentLength,
      contentType: head.ContentType,
      etag: head.ETag,
    };
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    return { exists: false };
  }
}

export async function createPresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 3600
): Promise<string> {
  // If in Git storage, direct to media stream route
  if (await gitStorageObjectExists(storageKey)) {
    return `/api/media/file?key=${encodeURIComponent(storageKey)}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  } catch {
    return `/api/media/file?key=${encodeURIComponent(storageKey)}`;
  }
}

export async function getObjectBuffer(storageKey: string): Promise<Buffer> {
  // 1. Check Git Storage Vault
  const gitRes = await getGitStorageBuffer(storageKey);
  if (gitRes.exists) {
    return gitRes.buffer;
  }

  // 2. S3 fallback
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  const response = await s3Client.send(command);
  const byteArray = await response.Body?.transformToByteArray();
  if (!byteArray) throw new Error("Empty storage payload");
  return Buffer.from(byteArray);
}

export async function putObjectBuffer(
  storageKey: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
  } catch {
    // S3 optional when git storage is primary
  }
}

export async function deleteStorageObject(storageKey: string): Promise<void> {
  await deleteGitStorageObject(storageKey);

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });

    await s3Client.send(command);
  } catch {
    // S3 optional
  }
}



