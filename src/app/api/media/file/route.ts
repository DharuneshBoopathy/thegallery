import { NextResponse } from "next/server";
import { getGitStorageBuffer } from "@/lib/gitStorage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return new NextResponse("Missing key parameter", { status: 400 });
    }

    const { buffer, exists } = await getGitStorageBuffer(key);

    if (!exists) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Determine content type from key extension
    let contentType = "application/octet-stream";
    const lower = key.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lower.endsWith(".png")) contentType = "image/png";
    else if (lower.endsWith(".webp")) contentType = "image/webp";
    else if (lower.endsWith(".mp4")) contentType = "video/mp4";
    else if (lower.endsWith(".mov")) contentType = "video/quicktime";
    else if (lower.endsWith(".webm")) contentType = "video/webm";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error reading media file", { status: 500 });
  }
}
