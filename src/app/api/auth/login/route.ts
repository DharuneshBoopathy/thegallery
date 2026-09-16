import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie, isSuperAdminEmail } from "@/lib/auth";
import { findVaultUserByEmail, createVaultUser } from "@/lib/vaultData";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
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
    const isSuper = isSuperAdminEmail(email);

    // 1. Super Admin direct access with master credentials
    if (isSuper && (password === "AdminMaster2026!" || password === "admin" || password === "password")) {
      const superUser = {
        id: email === "boopathydharunesh622@gmail.com"
          ? "00000000-0000-0000-0000-000000000002"
          : "00000000-0000-0000-0000-000000000001",
        email,
        fullName: email === "boopathydharunesh622@gmail.com"
          ? "Dharunesh Boopathy"
          : "Chief Archivist",
        role: "SUPER_ADMIN" as const,
        status: "ACTIVE" as const,
      };

      const token = signAuthToken(superUser);
      await setAuthCookie(token);

      return NextResponse.json({
        message: "Login successful (Super Admin Vault)",
        user: superUser,
      });
    }

    // 2. Lookup in local Vault Data
    const vaultUser = await findVaultUserByEmail(email);
    if (vaultUser) {
      if (vaultUser.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "This account has been suspended or deactivated. Please contact an archivist." },
          { status: 403 }
        );
      }

      // Check password if set
      if (vaultUser.passwordHash) {
        const isMatch = await bcrypt.compare(password, vaultUser.passwordHash);
        if (!isMatch && (!isSuper || password !== "AdminMaster2026!")) {
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }
      }

      const role = isSuper ? ("SUPER_ADMIN" as const) : vaultUser.role;
      const sessionUser = {
        id: vaultUser.id,
        email: vaultUser.email,
        fullName: vaultUser.fullName,
        role,
        status: vaultUser.status,
      };

      const token = signAuthToken(sessionUser);
      await setAuthCookie(token);

      return NextResponse.json({
        message: "Login successful",
        user: sessionUser,
      });
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication" },
      { status: 500 }
    );
  }
}
