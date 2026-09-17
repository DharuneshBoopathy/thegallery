import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  await clearAuthCookie();
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set("aj_auth_token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: false,
    httpOnly: false,
  });
  return res;
}

export async function GET(req: Request) {
  await clearAuthCookie();
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set("aj_auth_token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: false,
    httpOnly: false,
  });
  return res;
}
