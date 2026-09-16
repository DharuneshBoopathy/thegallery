import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const personTagSchema = z.object({
  assetId: z.string().uuid(),
  manualName: z.string().trim().min(2).max(60).optional(),
  targetUserId: z.string().uuid().optional(),
  boxX: z.number().min(0).max(1).optional(),
  boxY: z.number().min(0).max(1).optional(),
  boxWidth: z.number().min(0).max(1).optional(),
  boxHeight: z.number().min(0).max(1).optional(),
});

// POST /api/media/tags/person - Tag a person with optional bounding box
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = personTagSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { assetId, manualName, targetUserId, boxX, boxY, boxWidth, boxHeight } = result.data;

    if (!manualName && !targetUserId) {
      return NextResponse.json(
        { error: "Must provide either a registered user ID or a manual person name." },
        { status: 400 }
      );
    }

    const asset = await db.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const personTag = await db.personTag.create({
      data: {
        assetId,
        createdById: user.id,
        userId: targetUserId || null,
        manualName: manualName || null,
        boxX,
        boxY,
        boxWidth,
        boxHeight,
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    return NextResponse.json({
      message: "Person tag added to memory",
      personTag: {
        id: personTag.id,
        name: personTag.manualName || personTag.user?.fullName,
        box: {
          x: personTag.boxX,
          y: personTag.boxY,
          w: personTag.boxWidth,
          h: personTag.boxHeight,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create person tag" },
      { status: 500 }
    );
  }
}
