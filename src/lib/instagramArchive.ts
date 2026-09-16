import fs from "fs";
import path from "path";
import sharp from "sharp";

// heic-decode is loaded dynamically to avoid build-time issues
let heicDecode: any = null;
async function getHeicDecoder() {
  if (!heicDecode) {
    heicDecode = (await import("heic-decode")).default || (await import("heic-decode"));
  }
  return heicDecode;
}

export const INSTA_CONSOLIDATED_DIR =
  process.env.MEDIA_SOURCE_DIR ||
  path.resolve("C:/Projects/insta/Instagram_Consolidated");

export const DERIVATIVES_DIR = path.resolve(
  process.cwd(),
  ".storage_repo/public/derivatives"
);

export interface ArchiveMediaEntry {
  id: string;
  index: number;
  filename: string;
  originalFilename: string;
  absolutePath: string;
  storageKey: string;
  mimeType: string;
  isVideo: boolean;
  capturedAt: string;
  captureYear: number;
  captureMonth: number;
  sizeBytes: number;
}

// In-memory cache for the 4,092 indexed entries
let cachedEntries: ArchiveMediaEntry[] | null = null;
let lastScanTime = 0;

export function getArchiveEntries(): ArchiveMediaEntry[] {
  const now = Date.now();
  // Cache for 60 seconds unless invalidated
  if (cachedEntries && now - lastScanTime < 60000) {
    return cachedEntries;
  }

  const entries: ArchiveMediaEntry[] = [];

  // 1. Scan Instagram Consolidated Directory
  if (fs.existsSync(INSTA_CONSOLIDATED_DIR)) {
    const filenames = fs.readdirSync(INSTA_CONSOLIDATED_DIR);

    for (const f of filenames) {
      if (f.startsWith(".") || f === ".gitkeep") continue;

      const m = f.match(
        /^(\d+)__(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})(?:\.(\d+))?__(.+)$/
      );

      const ext = path.extname(f).toLowerCase();
      const isVideo = ext === ".mp4" || ext === ".mov" || ext === ".webm";

      let mimeType = "image/jpeg";
      if (isVideo) mimeType = "video/mp4";
      else if (ext === ".heic") mimeType = "image/heic";
      else if (ext === ".png") mimeType = "image/png";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".dng") mimeType = "image/x-adobe-dng";

      let index = 0;
      let dateIso = new Date().toISOString();
      let year = new Date().getFullYear();
      let month = new Date().getMonth() + 1;
      let origName = f;

      if (m) {
        index = parseInt(m[1], 10);
        const y = m[2];
        const mo = m[3];
        const d = m[4];
        const hr = m[5];
        const min = m[6];
        const sec = m[7];
        const ms = m[8] || "000";
        origName = m[9];
        year = parseInt(y, 10);
        month = parseInt(mo, 10);
        dateIso = `${y}-${mo}-${d}T${hr}:${min}:${sec}.${ms}Z`;
      } else {
        // Fallback for files without prefix
        try {
          const stat = fs.statSync(path.join(INSTA_CONSOLIDATED_DIR, f));
          dateIso = stat.mtime.toISOString();
          year = stat.mtime.getFullYear();
        } catch {}
      }

      entries.push({
        id: f,
        index,
        filename: f,
        originalFilename: origName,
        absolutePath: path.join(INSTA_CONSOLIDATED_DIR, f),
        storageKey: `insta/${f}`,
        mimeType,
        isVideo,
        capturedAt: dateIso,
        captureYear: year,
        captureMonth: month,
        sizeBytes: 0, // populated on-demand
      });
    }
  }

  // 2. Also include any files in .storage_repo/public/photos or videos
  const localPhotosDir = path.resolve(process.cwd(), ".storage_repo/public/photos");
  if (fs.existsSync(localPhotosDir)) {
    const localFiles = fs.readdirSync(localPhotosDir);
    for (const f of localFiles) {
      if (f.startsWith(".") || f === ".gitkeep") continue;
      // Skip if already in entries
      if (entries.some((e) => e.filename === f)) continue;

      const fullPath = path.join(localPhotosDir, f);
      let statDate = new Date();
      try {
        statDate = fs.statSync(fullPath).mtime;
      } catch {}

      entries.push({
        id: f,
        index: entries.length + 1,
        filename: f,
        originalFilename: f.replace(/^\d+_[a-z0-9]+_/, ""),
        absolutePath: fullPath,
        storageKey: `public/photos/${f}`,
        mimeType: "image/jpeg",
        isVideo: false,
        capturedAt: statDate.toISOString(),
        captureYear: statDate.getFullYear(),
        captureMonth: statDate.getMonth() + 1,
        sizeBytes: 0,
      });
    }
  }

  // Sort strictly by date from metadata (2023-09-05 through 2026-08-20)
  entries.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt) || a.index - b.index);

  cachedEntries = entries;
  lastScanTime = now;
  return cachedEntries;
}

/**
 * Filter and query entries with pagination
 */
export function queryArchiveEntries(options: {
  cursor?: string | null;
  limit?: number;
  year?: string | null;
  type?: string | null; // "photos" | "videos" | "all"
  sort?: string | null; // "asc" (default: oldest first) | "desc" (newest first)
  query?: string | null;
}): { items: ArchiveMediaEntry[]; nextCursor: string | null; total: number } {
  let all = [...getArchiveEntries()];

  // Sort: default "asc" (order of dates from metadata), or "desc"
  const sortDir = options.sort === "desc" ? "desc" : "asc";
  if (sortDir === "desc") {
    all.reverse();
  }

  // Year filter
  if (options.year && options.year !== "ALL") {
    const y = parseInt(options.year, 10);
    if (!isNaN(y)) {
      all = all.filter((item) => item.captureYear === y);
    }
  }

  // Type filter
  if (options.type === "photos") {
    all = all.filter((item) => !item.isVideo);
  } else if (options.type === "videos") {
    all = all.filter((item) => item.isVideo);
  }

  // Query filter
  if (options.query && options.query.trim()) {
    const q = options.query.trim().toLowerCase();
    all = all.filter(
      (item) =>
        item.filename.toLowerCase().includes(q) ||
        item.originalFilename.toLowerCase().includes(q) ||
        item.capturedAt.toLowerCase().includes(q)
    );
  }

  const total = all.length;
  const limit = options.limit || 30;

  let startIndex = 0;
  if (options.cursor) {
    const idx = all.findIndex((item) => item.id === options.cursor);
    if (idx !== -1) {
      startIndex = idx + 1;
    }
  }

  const sliced = all.slice(startIndex, startIndex + limit);
  const nextCursor =
    startIndex + limit < all.length ? sliced[sliced.length - 1]?.id : null;

  return {
    items: sliced,
    nextCursor,
    total,
  };
}

/**
 * Get a thumbnail buffer for a file, generating and caching WebP if needed
 */
export async function getOrCreateThumbnail(
  filename: string
): Promise<{ buffer: Buffer; contentType: string }> {
  if (!fs.existsSync(DERIVATIVES_DIR)) {
    fs.mkdirSync(DERIVATIVES_DIR, { recursive: true });
  }

  const baseName = path.parse(filename).name;
  const thumbPath = path.join(DERIVATIVES_DIR, `${baseName}_thumb.webp`);

  // 1. If cached thumbnail exists, return it immediately
  if (fs.existsSync(thumbPath)) {
    const buf = await fs.promises.readFile(thumbPath);
    return { buffer: buf, contentType: "image/webp" };
  }

  // 2. Locate original file
  const fullPath = path.join(INSTA_CONSOLIDATED_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    // Check fallback in .storage_repo/public/photos
    const altPath = path.resolve(process.cwd(), ".storage_repo/public/photos", filename);
    if (!fs.existsSync(altPath)) {
      throw new Error(`Media file not found: ${filename}`);
    }
    return generateThumbnailForPath(altPath, thumbPath);
  }

  return generateThumbnailForPath(fullPath, thumbPath);
}

async function generateThumbnailForPath(
  sourcePath: string,
  thumbPath: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const ext = path.extname(sourcePath).toLowerCase();

  // If HEIC: use heic-decode
  if (ext === ".heic") {
    try {
      const decode = await getHeicDecoder();
      const rawBuf = await fs.promises.readFile(sourcePath);
      const { data, width, height } = await decode({ buffer: rawBuf });

      const thumbBuffer = await sharp(Buffer.from(data), {
        raw: { width, height, channels: 4 },
      })
        .resize({ width: 540, height: 540, fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      // Cache asynchronously
      fs.promises.writeFile(thumbPath, thumbBuffer).catch(() => {});
      return { buffer: thumbBuffer, contentType: "image/webp" };
    } catch (err: any) {
      console.error("Failed HEIC thumbnail decode:", err.message);
    }
  }

  // For JPG, PNG, WEBP:
  try {
    const thumbBuffer = await sharp(sourcePath)
      .resize({ width: 540, height: 540, fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    fs.promises.writeFile(thumbPath, thumbBuffer).catch(() => {});
    return { buffer: thumbBuffer, contentType: "image/webp" };
  } catch (err: any) {
    // If video or unsupported image, read raw or return placeholder
    if (ext === ".mp4" || ext === ".mov") {
      // Empty or minimal svg fallback thumbnail for video
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480" fill="#0f172a"><rect width="100%" height="100%" fill="#1e293b"/><circle cx="240" cy="240" r="48" fill="#ffffff" opacity="0.9"/><polygon points="230,220 260,240 230,260" fill="#0f172a"/></svg>`
      );
      const webp = await sharp(svg).webp().toBuffer();
      return { buffer: webp, contentType: "image/webp" };
    }
    throw err;
  }
}

/**
 * Get displayable full-resolution buffer for Lightbox
 */
export async function getDisplayableMedia(
  filename: string
): Promise<{ buffer: Buffer; contentType: string }> {
  let fullPath = path.join(INSTA_CONSOLIDATED_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    const altPath = path.resolve(process.cwd(), ".storage_repo/public/photos", filename);
    if (fs.existsSync(altPath)) {
      fullPath = altPath;
    } else {
      throw new Error(`Media not found: ${filename}`);
    }
  }

  const ext = path.extname(fullPath).toLowerCase();

  // If HEIC: convert to JPEG/WebP for browser display
  if (ext === ".heic") {
    if (!fs.existsSync(DERIVATIVES_DIR)) {
      fs.mkdirSync(DERIVATIVES_DIR, { recursive: true });
    }
    const fullConvertedPath = path.join(
      DERIVATIVES_DIR,
      `${path.parse(filename).name}_full.webp`
    );

    if (fs.existsSync(fullConvertedPath)) {
      const buf = await fs.promises.readFile(fullConvertedPath);
      return { buffer: buf, contentType: "image/webp" };
    }

    const decode = await getHeicDecoder();
    const rawBuf = await fs.promises.readFile(fullPath);
    const { data, width, height } = await decode({ buffer: rawBuf });

    const convertedBuffer = await sharp(Buffer.from(data), {
      raw: { width, height, channels: 4 },
    })
      .webp({ quality: 90 })
      .toBuffer();

    fs.promises.writeFile(fullConvertedPath, convertedBuffer).catch(() => {});
    return { buffer: convertedBuffer, contentType: "image/webp" };
  }

  // If video or native image: read and return directly
  const buf = await fs.promises.readFile(fullPath);
  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".mp4") contentType = "video/mp4";
  else if (ext === ".mov") contentType = "video/quicktime";
  else if (ext === ".webm") contentType = "video/webm";

  return { buffer: buf, contentType };
}
