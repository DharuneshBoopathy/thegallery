import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getObjectBuffer } from "@/lib/storage";

// GET /api/media/[id]/stream - Secure media proxy with anti-cache & security headers
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Strict centralized permission evaluation (PRD Section 9.5)
    const { evaluateMediaAccess } = await import("@/lib/permissions");
    const decision = await evaluateMediaAccess(user.id, id);

    if (decision === "DENY") {
      // Must return 404 to prevent enumeration / information leakage
      return new NextResponse("Not Found", { status: 404 });
    }

    const asset = await db.mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Log access for audit trail (PRD Section 23)
    await db.accessLog.create({
      data: {
        assetId: asset.id,
        userId: user.id,
        action: "VIEW",
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    // Fetch buffer from storage
    const buffer = await getObjectBuffer(asset.storageKey);

    // Stream with strict anti-leak, anti-caching, and download-deterrent security headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    return new NextResponse("Media retrieval failed", { status: 500 });
  }
}
