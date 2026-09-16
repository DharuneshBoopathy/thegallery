import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie, isSuperAdminEmail } from "@/lib/auth";
import { createVaultUser, findVaultUserByEmail } from "@/lib/vaultData";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error || "Google authentication was cancelled")}`, req.url)
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange code for Google access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || "Failed to exchange Google OAuth code");
    }

    // 2. Fetch Google User Profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email) {
      throw new Error("Failed to retrieve Google user profile");
    }

    const email = profile.email.toLowerCase().trim();
    const fullName = profile.name || email.split("@")[0];
    const isSuper = isSuperAdminEmail(email);

    // 3. Find or create vault user
    let user = await findVaultUserByEmail(email);
    if (!user) {
      user = await createVaultUser({
        email,
        fullName,
        role: isSuper ? "SUPER_ADMIN" : "MEMBER",
        avatarUrl: profile.picture,
      });
    }

    // 4. Issue session cookie
    const sessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: isSuper ? ("SUPER_ADMIN" as const) : user.role,
      status: user.status,
    };

    const token = signAuthToken(sessionUser);
    await setAuthCookie(token);

    return NextResponse.redirect(new URL("/archive", req.url));
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || "Google sign in failed")}`, req.url)
    );
  }
}
