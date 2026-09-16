import { NextResponse } from "next/server";
import { createVaultAccessRequest, findVaultUserByEmail } from "@/lib/vaultData";
import { z } from "zod";

const requestSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  collegeId: z.string().trim().optional(),
  batchYear: z.number().int().optional(),
  department: z.string().trim().optional(),
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
    const existingUser = await findVaultUserByEmail(data.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    const accessRequest = createVaultAccessRequest({
      fullName: data.fullName,
      email: data.email,
      collegeBatch: data.department ? `${data.department} ${data.batchYear || ""}` : undefined,
      collegeYear: data.batchYear,
      notes: data.verificationNote || data.collegeId ? `ID: ${data.collegeId || "N/A"} - ${data.verificationNote || ""}` : undefined,
    });

    return NextResponse.json({
      message: "Access request submitted successfully. An archivist will review your request.",
      requestId: accessRequest.id,
    });
  } catch (error: any) {
    console.error("Access request submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit access request" },
      { status: 500 }
    );
  }
}
