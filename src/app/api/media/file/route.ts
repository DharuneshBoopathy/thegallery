import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  INSTA_CONSOLIDATED_DIR,
  getOrCreateThumbnail,
  getDisplayableMedia,
} from "@/lib/instagramArchive";
import { getGitStorageBuffer } from "@/lib/gitStorage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawKey = searchParams.get("key");
    const isThumb = searchParams.get("thumb") === "1";

    if (!rawKey) {
      return new NextResponse("Missing key parameter", { status: 400 });
    }

    // Clean key
    const filename = rawKey
      .replace(/^insta\//, "")
      .replace(/^public\/(photos|videos|derivatives)\//, "");
    const ext = path.extname(filename).toLowerCase();

    // 1. Thumbnail requested or thumbnail key
    if (isThumb || filename.includes("_thumb")) {
      const origFilename = filename.replace(/_thumb\.webp$/, "");
      try {
        const { buffer, contentType } = await getOrCreateThumbnail(origFilename);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      } catch (thumbErr: any) {
        // Continue to check other sources
      }
    }

    // 2. Direct lookup in INSTA_CONSOLIDATED_DIR
    const instaPath = path.join(INSTA_CONSOLIDATED_DIR, filename);
    if (fs.existsSync(instaPath)) {
      // If HEIC: return displayable WebP conversion
      if (ext === ".heic") {
        const { buffer, contentType } = await getDisplayableMedia(filename);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }

      // If Video: handle HTTP Range requests for seeking
      if (ext === ".mp4" || ext === ".mov" || ext === ".webm") {
        const stat = fs.statSync(instaPath);
        const fileSize = stat.size;
        const range = req.headers.get("range");

        const contentType =
          ext === ".mp4"
            ? "video/mp4"
            : ext === ".mov"
            ? "video/quicktime"
            : "video/webm";

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          const fileStream = fs.createReadStream(instaPath, { start, end });
          const webStream = new ReadableStream({
            start(controller) {
              fileStream.on("data", (chunk) => controller.enqueue(chunk));
              fileStream.on("end", () => controller.close());
              fileStream.on("error", (err) => controller.error(err));
            },
            cancel() {
              fileStream.destroy();
            },
          });

          return new Response(webStream, {
            status: 206,
            headers: {
              "Content-Range": `bytes ${start}-${end}/${fileSize}`,
              "Accept-Ranges": "bytes",
              "Content-Length": chunkSize.toString(),
              "Content-Type": contentType,
            },
          });
        }

        // Full video stream
        const fileStream = fs.createReadStream(instaPath);
        const webStream = new ReadableStream({
          start(controller) {
            fileStream.on("data", (chunk) => controller.enqueue(chunk));
            fileStream.on("end", () => controller.close());
            fileStream.on("error", (err) => controller.error(err));
          },
          cancel() {
            fileStream.destroy();
          },
        });

        return new Response(webStream, {
          status: 200,
          headers: {
            "Accept-Ranges": "bytes",
            "Content-Length": fileSize.toString(),
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      // Standard images (jpg, png, webp, dng)
      const buffer = await fs.promises.readFile(instaPath);
      let contentType = "image/jpeg";
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    // 3. Fallback to local Git storage
    const { buffer, exists } = await getGitStorageBuffer(rawKey);
    if (exists) {
      let contentType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".mp4") contentType = "video/mp4";

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (err: any) {
    console.error("Error reading media file:", err);
    return new NextResponse("Error reading media file", { status: 500 });
  }
}
