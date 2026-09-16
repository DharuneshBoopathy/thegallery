import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/audit-logs - Query immutable security and activity logs
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const logs = await db.auditTrail.findMany({
      take: limit,
      where: action ? { action } : undefined,
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
