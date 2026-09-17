import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie, isSuperAdminEmail } from "@/lib/auth";
import {
  validateAndConsumeInviteCode,
  createVaultUser,
  findVaultUserByEmail,
} from "@/lib/vaultData";
import { z } from "zod";

const registerSchema = z.object({
  inviteCode: z.string().trim().min(3, "Invite code is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { inviteCode, email, fullName, password } = result.data;

    // 1. Check if user already exists
    const existing = await findVaultUserByEmail(email);
    if (existing && existing.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 400 }
      );
    }

    // 2. Validate & consume invite key (or bypass if super admin)
    const isSuper = isSuperAdminEmail(email);
    let assignedRole: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "CONTRIBUTOR" | "VIEWER" = isSuper
      ? "SUPER_ADMIN"
      : "MEMBER";

    if (!isSuper) {
      const inviteValidation = validateAndConsumeInviteCode(inviteCode);
      if (!inviteValidation.valid) {
        return NextResponse.json(
          { error: inviteValidation.error || "Invalid or depleted invitation code" },
          { status: 400 }
        );
      }
      if (inviteValidation.role) {
        assignedRole = inviteValidation.role;
      }
    }

    // 3. Create user in vault store
    const user = await createVaultUser({
      email,
      fullName,
      password,
      role: assignedRole,
    });

    const proto = req.headers.get("x-forwarded-proto") || "http";
    const isHttps = proto === "https" || req.url.startsWith("https:");

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    });

    await setAuthCookie(token, req);

    const res = NextResponse.json({
      message: "Registration successful. Welcome to The Gallery vault.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    res.cookies.set("aj_auth_token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: isHttps,
      httpOnly: false,
    });

    return res;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
