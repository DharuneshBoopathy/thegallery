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

    const token = signAuthToken(sessionUser);
    await setAuthCookie(token);

    return NextResponse.json({
      message: "Google sign-in successful",
      user: sessionUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to sign in with Google" },
      { status: 500 }
    );
  }
}
