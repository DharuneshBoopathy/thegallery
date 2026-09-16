import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Gender } from "@prisma/client";
import { z } from "zod";

const requestSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").toLowerCase(),
  collegeId: z.string().trim().min(2, "College ID / Enrollment number is required"),
  batchYear: z.number().int().min(1950).max(2050),
  department: z.string().trim().min(2, "Department is required"),
  gender: z.nativeEnum(Gender),
  verificationNote: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    // Check if pending request already exists
    const existingRequest = await db.accessRequest.findUnique({
      where: { email: data.email },
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      return NextResponse.json(
        { error: "An access request for this email is already under review." },
        { status: 409 }
      );
    }

    // Create or update access request
    const accessRequest = await db.accessRequest.upsert({
      where: { email: data.email },
      update: {
        fullName: data.fullName,
        collegeId: data.collegeId,
        batchYear: data.batchYear,
        department: data.department,
        gender: data.gender,
        verificationNote: data.verificationNote,
        status: "PENDING",
        rejectionReason: null,
      },
      create: {
        fullName: data.fullName,
        email: data.email,
        collegeId: data.collegeId,
        batchYear: data.batchYear,
        department: data.department,
        gender: data.gender,
        verificationNote: data.verificationNote,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Access request submitted successfully. An archivist will verify your batch details.",
        requestId: accessRequest.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
