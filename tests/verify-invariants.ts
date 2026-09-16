import { evaluateAccess, UserContext, MediaContext } from "../src/lib/permissions";
import { Role, UserStatus, Gender, VisibilityMode } from "@prisma/client";

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${testName}`);
}

console.log("\n=======================================================");
console.log("🔒 RUNNING AUTISTIC JOURNEY SECURITY INVARIANT SUITE");
console.log("=======================================================\n");

// Base Media fixture
const baseMedia: MediaContext = {
  id: "media-1",
  uploaderId: "user-creator",
  status: "READY",
  isArchived: false,
  visibilityMode: "PUBLIC_BATCH" as VisibilityMode,
  allowedGender: null,
  groupId: null,
  allowedUserIds: [],
};

// 1. AT-01: Admin Override Invariant
const adminUser: UserContext = {
  id: "user-admin",
  role: "ADMIN" as Role,
  status: "ACTIVE" as UserStatus,
  gender: "MALE" as Gender,
  activeGroupIds: [],
};
const femaleRestrictedMedia: MediaContext = {
  ...baseMedia,
  visibilityMode: "GENDER_RESTRICTED" as VisibilityMode,
  allowedGender: "FEMALE" as Gender,
};
assert(
  evaluateAccess(adminUser, femaleRestrictedMedia) === "ALLOW",
  "AT-01: Admin Override - Admin can access restricted media"
);

// 2. AT-02: Suspended Account Invariant
const suspendedUser: UserContext = {
  id: "user-suspended",
  role: "VIEWER" as Role,
  status: "SUSPENDED" as UserStatus,
  gender: "MALE" as Gender,
  activeGroupIds: ["group-1"],
};
assert(
  evaluateAccess(suspendedUser, baseMedia) === "DENY",
  "AT-02: Suspended Account Invariant - Suspended user is denied access"
);

// 3. AT-03: Gender-Restricted Media Isolation
const maleUser: UserContext = {
  id: "user-male",
  role: "CONTRIBUTOR" as Role,
  status: "ACTIVE" as UserStatus,
  gender: "MALE" as Gender,
  activeGroupIds: [],
};
const femaleUser: UserContext = {
  id: "user-female",
  role: "CONTRIBUTOR" as Role,
  status: "ACTIVE" as UserStatus,
  gender: "FEMALE" as Gender,
  activeGroupIds: [],
};
assert(
  evaluateAccess(maleUser, femaleRestrictedMedia) === "DENY",
  "AT-03a: Gender Isolation - Male user is denied access to female-restricted media"
);
assert(
  evaluateAccess(femaleUser, femaleRestrictedMedia) === "ALLOW",
  "AT-03b: Gender Isolation - Female user is granted access to female-restricted media"
);

// 4. AT-04: Group Media Isolation
const groupMedia: MediaContext = {
  ...baseMedia,
  visibilityMode: "GROUP_ONLY" as VisibilityMode,
  groupId: "circle-hostel-3",
};
const nonMember: UserContext = {
  id: "user-outsider",
  role: "CONTRIBUTOR" as Role,
  status: "ACTIVE" as UserStatus,
  gender: "MALE" as Gender,
  activeGroupIds: ["circle-music-club"],
};
const groupMember: UserContext = {
  id: "user-insider",
  role: "CONTRIBUTOR" as Role,
  status: "ACTIVE" as UserStatus,
  gender: "MALE" as Gender,
  activeGroupIds: ["circle-hostel-3"],
};
assert(
  evaluateAccess(nonMember, groupMedia) === "DENY",
  "AT-04a: Group Media Isolation - Non-group member is denied"
);
assert(
  evaluateAccess(groupMember, groupMedia) === "ALLOW",
  "AT-04b: Group Media Isolation - Group member is allowed"
);

// 5. AT-05: Group AND Gender Intersection
const groupAndGenderMedia: MediaContext = {
  ...baseMedia,
  visibilityMode: "GROUP_AND_GENDER" as VisibilityMode,
  groupId: "circle-hostel-3",
  allowedGender: "FEMALE" as Gender,
};
const maleGroupMember: UserContext = {
  ...groupMember,
  gender: "MALE" as Gender,
};
const femaleGroupMember: UserContext = {
  ...groupMember,
  id: "user-female-member",
  gender: "FEMALE" as Gender,
};
assert(
  evaluateAccess(maleGroupMember, groupAndGenderMedia) === "DENY",
  "AT-05a: Group & Gender Intersection - Male member of group is denied female-only media"
);
assert(
  evaluateAccess(femaleGroupMember, groupAndGenderMedia) === "ALLOW",
  "AT-05b: Group & Gender Intersection - Female member of group is allowed"
);

// 6. AT-06: Uploader Self-Access
const uploaderUser: UserContext = {
  id: "user-creator",
  role: "CONTRIBUTOR" as Role,
  status: "ACTIVE" as UserStatus,
  gender: "MALE" as Gender,
  activeGroupIds: [],
};
const privateMedia: MediaContext = {
  ...baseMedia,
  visibilityMode: "PRIVATE_CREATOR" as VisibilityMode,
};
assert(
  evaluateAccess(uploaderUser, privateMedia) === "ALLOW",
  "AT-06a: Uploader Self-Access - Uploader can view private media"
);
assert(
  evaluateAccess(maleUser, privateMedia) === "DENY",
  "AT-06b: Uploader Self-Access - Other user cannot view private media"
);

// 7. AT-07: Unready / Archived Media Isolation
const unreadyMedia: MediaContext = {
  ...baseMedia,
  status: "PROCESSING",
};
assert(
  evaluateAccess(uploaderUser, unreadyMedia) === "ALLOW",
  "AT-07a: Media State - Uploader can inspect processing media"
);
assert(
  evaluateAccess(maleUser, unreadyMedia) === "DENY",
  "AT-07b: Media State - Non-uploader cannot inspect processing media"
);

// 8. AT-08: Specific Users Whitelist
const whitelistMedia: MediaContext = {
  ...baseMedia,
  visibilityMode: "SPECIFIC_USERS" as VisibilityMode,
  allowedUserIds: ["user-male", "user-whitelisted"],
};
assert(
  evaluateAccess(maleUser, whitelistMedia) === "ALLOW",
  "AT-08a: Whitelist - Whitelisted user is allowed"
);
assert(
  evaluateAccess(nonMember, whitelistMedia) === "DENY",
  "AT-08b: Whitelist - Non-whitelisted user is denied"
);

console.log("\n=======================================================");
console.log("🎉 ALL 12 AUTHORIZATION & PRIVACY INVARIANTS PASSED 100%");
console.log("=======================================================\n");
