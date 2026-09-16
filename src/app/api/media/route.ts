import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryArchiveEntries } from "@/lib/instagramArchive";

// GET /api/media - Paginated feed of consolidated archive media in strict date order
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    // Allow authenticated user, with fallback for local access
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 60);
    const yearParam = searchParams.get("year");
    const mediaType = searchParams.get("type"); // "photos", "videos", or "all"
    const sortParam = searchParams.get("sort") || "asc"; // "asc" (order of dates from metadata) or "desc"
    const queryParam = searchParams.get("q");

    const { items, nextCursor, total } = queryArchiveEntries({
      cursor,
      limit,
      year: yearParam,
      type: mediaType,
      sort: sortParam,
      query: queryParam,
    });

    const formatted = items.map((entry) => ({
      id: entry.id,
      originalFilename: entry.originalFilename,
      mimeType: entry.mimeType,
      isVideo: entry.isVideo,
      capturedAt: entry.capturedAt,
      captureYear: entry.captureYear,
      uploader: {
        id: user?.id || "vault",
        fullName: user?.fullName || "Chief Archivist",
      },
      thumbnailUrl: `/api/media/file?key=${encodeURIComponent(entry.filename)}&thumb=1`,
      originalUrl: `/api/media/file?key=${encodeURIComponent(entry.filename)}`,
      tags: [entry.captureYear ? `${entry.captureYear}` : "Archive"],
      personTags: [],
    }));

    return NextResponse.json({
      items: formatted,
      nextCursor,
      total,
    });
  } catch (error: any) {
    console.error("Failed to load archive gallery:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load archive gallery" },
      { status: 500 }
    );
  }
}
