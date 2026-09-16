import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role, UserStatus } from "@prisma/client";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-insecure-dev-secret-key-replace-me";
const TOKEN_COOKIE_NAME = "aj_auth_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
}

export function signAuthToken(user: AuthSessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    },
    AUTH_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyAuthToken(token: string): AuthSessionUser | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
      status: decoded.status,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<AuthSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
