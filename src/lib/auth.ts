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
  role: Role | "MEMBER";
  status: UserStatus;
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return (
    lower === "boopathydharunesh622@gmail.com" ||
    lower === "admin@thegallery.local" ||
    lower === "admin@autisticjourney.local"
  );
}

export function signAuthToken(user: AuthSessionUser): string {
  const isSuper = isSuperAdminEmail(user.email);
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: isSuper ? "SUPER_ADMIN" : user.role,
      status: user.status,
    },
    AUTH_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyAuthToken(token: string): AuthSessionUser | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as any;
    const isSuper = isSuperAdminEmail(decoded.email);
    return {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
      role: isSuper ? "SUPER_ADMIN" : decoded.role,
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

export async function setAuthCookie(token: string, req?: Request) {
  const cookieStore = await cookies();
  const proto = req ? req.headers.get("x-forwarded-proto") : null;
  const isHttps = proto === "https" || process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
    secure: Boolean(isHttps),
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
