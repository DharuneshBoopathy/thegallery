import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  // Security sensitive: gender can only be modified if isGenderLocked is false, or if admin
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).optional(),
});

// GET /api/user/profile - Fetch full user profile
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        gender: true,
        isGenderLocked: true,
        avatarUrl: true,
        bio: true,
        graduationYear: true,
        collegeId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Update user profile with gender immutability guard
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const currentProfile = await db.user.findUnique({
      where: { id: session.id },
    });

    if (!currentProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (result.data.fullName !== undefined) updateData.fullName = result.data.fullName;
    if (result.data.bio !== undefined) updateData.bio = result.data.bio;
    if (result.data.avatarUrl !== undefined) updateData.avatarUrl = result.data.avatarUrl;

    // Enforce Gender Immutability Check (PRD Section 6 & 21)
    if (result.data.gender !== undefined) {
      const isSuperAdmin = session.role === "SUPER_ADMIN";
      if (currentProfile.isGenderLocked && !isSuperAdmin) {
        return NextResponse.json(
          { error: "GENDER_LOCKED: Your gender attribute has been verified and locked. Contact Super Admin for alterations." },
          { status: 403 }
        );
      }
      updateData.gender = result.data.gender;
      // Lock it upon initial non-default setting by user
      if (result.data.gender !== "PREFER_NOT_TO_SAY" && !isSuperAdmin) {
        updateData.isGenderLocked = true;
      }
    }

    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        gender: true,
        isGenderLocked: true,
        avatarUrl: true,
        bio: true,
      },
    });

    await db.auditTrail.create({
      data: {
        userId: session.id,
        action: "PROFILE_UPDATED",
        resource: "User",
        resourceId: session.id,
        detailsJson: updateData,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
