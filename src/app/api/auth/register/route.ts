import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  inviteCode: z.string().trim().min(3, "Invite code is required"),
  email: z.string().email("Invalid email address").toLowerCase(),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

    // 1. Validate Invite Code inside a transaction
    const user = await db.$transaction(async (tx) => {
      const codeRecord = await tx.inviteCode.findUnique({
        where: { code: inviteCode },
      });

      if (!codeRecord) {
        throw new Error("INVALID_CODE: Invite code does not exist.");
      }

      if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
        throw new Error("EXPIRED_CODE: This invite code has expired.");
      }

      if (codeRecord.usesCount >= codeRecord.maxUses) {
        throw new Error("DEPLETED_CODE: This invite code has reached its maximum uses.");
      }

      // 2. Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("EMAIL_EXISTS: An account with this email already exists.");
      }

      // 3. Hash password and create user
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await tx.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role: codeRecord.role,
          invitedById: codeRecord.createdById,
        },
      });

      // 4. Increment invite code usage counter
      await tx.inviteCode.update({
        where: { id: codeRecord.id },
        data: {
          usesCount: { increment: 1 },
        },
      });

      // 5. Create audit entry
      await tx.auditTrail.create({
        data: {
          userId: newUser.id,
          action: "USER_REGISTERED",
          resource: "User",
          resourceId: newUser.id,
          detailsJson: {
            inviteCodeUsed: inviteCode,
            assignedRole: codeRecord.role,
          },
        },
      });

      return newUser;
    });

    // 6. Generate Session Token and set cookie
    const token = signAuthToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const message = error.message || "Registration failed";
    const status = message.includes("INVALID_CODE") || message.includes("EXPIRED_CODE") || message.includes("DEPLETED_CODE") || message.includes("EMAIL_EXISTS")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
