import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPresignedDownloadUrl } from "@/lib/storage";

// GET /api/media - Paginated feed of authorized archive media
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 24, 60);
    const yearParam = searchParams.get("year");
    const mediaType = searchParams.get("type"); // "photos", "videos", or undefined

    let assets: any[] = [];
    let nextCursor: string | null = null;
    let items: any[] = [];

    try {
      // Centralized server-side permission filter (PRD Section 9.5)
      const { buildAuthorizedMediaWhereClause } = await import("@/lib/permissions");
      const authorizedWhere = await buildAuthorizedMediaWhereClause(user.id);

      const where: any = {
        AND: [
          authorizedWhere,
          yearParam ? { captureYear: Number(yearParam) } : {},
          mediaType === "photos" ? { mimeType: { startsWith: "image/" } } : {},
          mediaType === "videos" ? { mimeType: { startsWith: "video/" } } : {},
        ],
      };

      assets = await db.mediaAsset.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        where,
        orderBy: [
          { capturedAt: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          uploader: {
            select: { id: true, fullName: true },
          },
          variants: {
            select: { variantType: true, storageKey: true, width: true, height: true },
          },
          assetTags: {
            include: { tag: true },
          },
          personTags: {
            include: { user: { select: { fullName: true } } },
          },
        },
      });

      items = assets;
      if (items.length > limit) {
        items.pop();
        nextCursor = items[items.length - 1].id;
      }
    } catch (dbErr) {
      // Fallback: discover files directly from local Git storage repository
      const fs = await import("fs");
      const path = await import("path");
      const repoPath = path.resolve(process.cwd(), ".storage_repo");

      const scanDir = (relDir: string): any[] => {
        const fullDir = path.join(repoPath, relDir);
        if (!fs.existsSync(fullDir)) return [];
        const files = fs.readdirSync(fullDir);
        return files
          .filter((f) => !f.startsWith(".") && f !== ".gitkeep")
          .map((f) => {
            const relKey = path.posix.join(relDir.replace(/\\/g, "/"), f);
            const isVid = f.endsWith(".mp4") || f.endsWith(".mov") || f.endsWith(".webm");
            const thumbKey = relKey.replace("/photos/", "/derivatives/").replace(/\.[^.]+$/, "_thumb.webp");
            const hasThumb = fs.existsSync(path.join(repoPath, thumbKey));

            return {
              id: f,
              originalFilename: f.replace(/^\d+_[a-z0-9]+_/, ""),
              storageKey: relKey,
              mimeType: isVid ? "video/mp4" : "image/jpeg",
              uploader: { id: user.id, fullName: user.fullName || "Archivist" },
              variants: hasThumb ? [{ variantType: "THUMBNAIL_MD", storageKey: thumbKey }] : [],
              assetTags: [],
              personTags: [],
              capturedAt: new Date().toISOString(),
              captureYear: new Date().getFullYear(),
            };
          });
      };

      const publicPhotos = scanDir("public/photos");
      const publicVideos = scanDir("public/videos");
      let groupPhotos: any[] = [];
      const groupsRoot = path.join(repoPath, "groups");
      if (fs.existsSync(groupsRoot)) {
        const groupDirs = fs.readdirSync(groupsRoot);
        for (const gd of groupDirs) {
          groupPhotos.push(...scanDir(path.join("groups", gd, "photos")));
          groupPhotos.push(...scanDir(path.join("groups", gd, "videos")));
        }
      }

      items = [...publicPhotos, ...publicVideos, ...groupPhotos];
    }

    // Attach display URLs
    const formatted = await Promise.all(
      items.map(async (asset) => {
        const thumbVariant = asset.variants?.find((v: any) => v.variantType === "THUMBNAIL_MD");
        const thumbKey = thumbVariant ? thumbVariant.storageKey : asset.storageKey;
        const thumbnailUrl = await createPresignedDownloadUrl(thumbKey, 3600);
        const originalUrl = await createPresignedDownloadUrl(asset.storageKey, 3600);

        return {
          id: asset.id,
          originalFilename: asset.originalFilename,
          mimeType: asset.mimeType,
          isVideo: asset.mimeType?.startsWith("video/"),
          capturedAt: asset.capturedAt,
          captureYear: asset.captureYear,
          width: asset.width,
          height: asset.height,
          durationSeconds: asset.durationSeconds,
          deviceMake: asset.deviceMake,
          deviceModel: asset.deviceModel,
          uploader: asset.uploader,
          thumbnailUrl,
          originalUrl,
          tags: asset.assetTags?.map((at: any) => at.tag.name) || [],
          personTags: asset.personTags?.map((pt: any) => ({
            id: pt.id,
            name: pt.manualName || pt.user?.fullName || "Anonymous",
            boxX: pt.boxX || undefined,
            boxY: pt.boxY || undefined,
          })) || [],
        };
      })
    );

    return NextResponse.json({
      items: formatted,
      nextCursor,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load archive gallery" },
      { status: 500 }
    );
  }
}

