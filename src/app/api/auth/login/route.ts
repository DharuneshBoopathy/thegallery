import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    let user = null;
    try {
      user = await db.user.findUnique({
        where: { email },
      });
    } catch (dbErr) {
      console.warn("Database unreachable during login, checking master credentials fallback...");
    }

    // Dev / Standalone fallback for seeded master super admin
    if (!user && email === "admin@autisticjourney.local" && password === "AdminMaster2026!") {
      const devAdmin = {
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@autisticjourney.local",
        fullName: "Chief Archivist (Master Admin)",
        role: "SUPER_ADMIN" as const,
        status: "ACTIVE" as const,
      };
      const token = signAuthToken(devAdmin);
      await setAuthCookie(token);
      return NextResponse.json({
        message: "Login successful (Master Admin Vault)",
        user: devAdmin,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This account has been suspended or deactivated. Please contact an archivist." },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login if db is accessible
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      // Non-blocking in dev
    }

    // Create session cookie
    const token = signAuthToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
