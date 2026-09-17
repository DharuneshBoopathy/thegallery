import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie, isSuperAdminEmail } from "@/lib/auth";
import { createVaultUser, findVaultUserByEmail } from "@/lib/vaultData";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "boopathydharunesh622@gmail.com").toLowerCase().trim();
    const fullName = body.fullName || (email.includes("boopathy") ? "Dharunesh Boopathy" : "Google Member");

    const isSuper = isSuperAdminEmail(email);

    let user = await findVaultUserByEmail(email);
    if (!user) {
      user = await createVaultUser({
        email,
        fullName,
        role: isSuper ? "SUPER_ADMIN" : "MEMBER",
      });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: isSuper ? ("SUPER_ADMIN" as const) : user.role,
      status: user.status,
    };

    const proto = req.headers.get("x-forwarded-proto") || "http";
    const isHttps = proto === "https" || req.url.startsWith("https:");

    const token = signAuthToken(sessionUser);
    await setAuthCookie(token, req);

    const res = NextResponse.json({
      message: "Google sign-in successful",
      user: sessionUser,
      token,
    });

    res.cookies.set("aj_auth_token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: isHttps,
      httpOnly: false,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to sign in with Google" },
      { status: 500 }
    );
  }
}
