import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Create Default Master Super Admin User
  const masterEmail = "admin@autisticjourney.local";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: masterEmail },
  });

  let adminUser = existingAdmin;
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("AdminMaster2026!", 12);
    adminUser = await prisma.user.create({
      data: {
        email: masterEmail,
        fullName: "Chief Archivist",
        passwordHash,
        role: Role.SUPER_ADMIN,
      },
    });
    console.log(`✅ Created Super Admin account: ${masterEmail}`);
  } else {
    console.log(`ℹ️ Super Admin account already exists.`);
  }

  // 2. Create Initial Golden Master Invite Codes
  const goldenInviteCode = "AJ-BATCH-2026-INIT";
  const existingCode = await prisma.inviteCode.findUnique({
    where: { code: goldenInviteCode },
  });

  if (!existingCode && adminUser) {
    await prisma.inviteCode.create({
      data: {
        code: goldenInviteCode,
        role: Role.CONTRIBUTOR,
        maxUses: 100,
        createdById: adminUser.id,
        note: "Initial Batch Onboarding Code",
      },
    });
    console.log(`✅ Seeded master invite code: ${goldenInviteCode}`);
  }

  // 3. Create Default Taxonomy Tags
  const defaultTags = [
    { name: "Freshers Orientation", category: "EVENT" as const },
    { name: "Convocation", category: "EVENT" as const },
    { name: "Hostel Life", category: "ACTIVITY" as const },
    { name: "College Fest", category: "EVENT" as const },
    { name: "Main Campus Quad", category: "LOCATION" as const },
    { name: "Class of 2026", category: "ACADEMIC_YEAR" as const },
  ];

  for (const t of defaultTags) {
    await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }
  console.log(`✅ Seeded default taxonomy tags (${defaultTags.length})`);

  console.log("🎉 Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
