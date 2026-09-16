import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryArchiveEntries } from "@/lib/instagramArchive";

// GET /api/search - Instant consolidated archive search engine
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const year = searchParams.get("year");
    const type = searchParams.get("type"); // "photos" | "videos" | "all"
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 60);

    const { items } = queryArchiveEntries({
      query,
      year: year && year !== "ALL" ? year : undefined,
      type,
      limit,
    });

    const results = items.map((entry) => ({
      id: entry.id,
      originalFilename: entry.originalFilename,
      mimeType: entry.mimeType,
      isVideo: entry.isVideo,
      capturedAt: entry.capturedAt,
      captureYear: entry.captureYear,
      uploader: {
        id: user?.id || "vault",
        fullName: user?.fullName || "Archive",
      },
      thumbnailUrl: `/api/media/file?key=${encodeURIComponent(entry.filename)}&thumb=1`,
      originalUrl: `/api/media/file?key=${encodeURIComponent(entry.filename)}`,
      tags: [entry.captureYear ? `${entry.captureYear}` : "Archive"],
      personTags: [],
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
