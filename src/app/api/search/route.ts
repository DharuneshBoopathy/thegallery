import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildAuthorizedMediaWhereClause } from "@/lib/permissions";
import { createPresignedDownloadUrl } from "@/lib/storage";

// GET /api/search - Multi-faceted archive search engine (PRD Section 27)
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const year = searchParams.get("year");
    const tag = searchParams.get("tag");
    const person = searchParams.get("person");
    const type = searchParams.get("type"); // "photos" | "videos"
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 60);

    const authorizedWhere = await buildAuthorizedMediaWhereClause(user.id);

    const andConditions: any[] = [authorizedWhere];

    // Text search query across filename, locationName, and device
    if (query) {
      andConditions.push({
        OR: [
          { originalFilename: { contains: query, mode: "insensitive" } },
          { locationName: { contains: query, mode: "insensitive" } },
          { deviceMake: { contains: query, mode: "insensitive" } },
          { deviceModel: { contains: query, mode: "insensitive" } },
          { assetTags: { some: { tag: { name: { contains: query, mode: "insensitive" } } } } },
          { personTags: { some: { manualName: { contains: query, mode: "insensitive" } } } },
        ],
      });
    }

    if (year) {
      andConditions.push({ captureYear: Number(year) });
    }

    if (tag) {
      andConditions.push({
        assetTags: { some: { tag: { name: tag } } },
      });
    }

    if (person) {
      andConditions.push({
        personTags: {
          some: {
            OR: [
              { manualName: { contains: person, mode: "insensitive" } },
              { user: { fullName: { contains: person, mode: "insensitive" } } },
            ],
          },
        },
      });
    }

    if (type === "photos") {
      andConditions.push({ mimeType: { startsWith: "image/" } });
    } else if (type === "videos") {
      andConditions.push({ mimeType: { startsWith: "video/" } });
    }

    const assets = await db.mediaAsset.findMany({
      take: limit,
      where: { AND: andConditions },
      orderBy: [
        { capturedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        uploader: { select: { fullName: true } },
        variants: { select: { variantType: true, storageKey: true } },
        assetTags: { include: { tag: true } },
        personTags: { include: { user: { select: { fullName: true } } } },
      },
    });

    const results = await Promise.all(
      assets.map(async (asset) => {
        const thumbVariant =
          asset.variants.find((v) => v.variantType === "THUMBNAIL_MD") ||
          asset.variants.find((v) => v.variantType === "THUMBNAIL_SM") ||
          asset.variants.find((v) => v.variantType === "OPTIMIZED_WEBP");

        const thumbKey = thumbVariant ? thumbVariant.storageKey : asset.storageKey;
        const thumbnailUrl = await createPresignedDownloadUrl(thumbKey, 3600);
        const originalUrl = await createPresignedDownloadUrl(asset.storageKey, 3600);

        return {
          id: asset.id,
          originalFilename: asset.originalFilename,
          mimeType: asset.mimeType,
          isVideo: asset.mimeType.startsWith("video/"),
          capturedAt: asset.capturedAt,
          captureYear: asset.captureYear,
          locationName: asset.locationName,
          uploader: { id: asset.uploaderId, fullName: asset.uploader.fullName },
          thumbnailUrl,
          originalUrl,
          tags: asset.assetTags.map((at) => at.tag.name),
          personTags: asset.personTags.map((pt) => ({
            id: pt.id,
            name: pt.manualName || pt.user?.fullName || "Anonymous",
            boxX: pt.boxX || undefined,
            boxY: pt.boxY || undefined,
          })),
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
