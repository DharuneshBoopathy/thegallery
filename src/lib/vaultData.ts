import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { isSuperAdminEmail } from "./auth";

const VAULT_FILE_PATH = path.resolve(process.cwd(), ".storage_repo/vault_data.json");

export interface VaultUser {
  id: string;
  email: string;
  fullName: string;
  passwordHash?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "CONTRIBUTOR" | "VIEWER";
  status: "ACTIVE" | "PENDING_SETUP" | "SUSPENDED" | "DEACTIVATED";
  createdAt: string;
  invitedById?: string;
  avatarUrl?: string;
}

export interface VaultInviteCode {
  id: string;
  code: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "CONTRIBUTOR" | "VIEWER";
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  note?: string;
  createdAt: string;
  createdById?: string;
}

export interface VaultAccessRequest {
  id: string;
  fullName: string;
  email: string;
  collegeBatch?: string;
  collegeYear?: number;
  idProofStorageKey?: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  rejectionReason?: string;
  generatedInviteCode?: string;
}

interface VaultData {
  users: VaultUser[];
  inviteCodes: VaultInviteCode[];
  accessRequests: VaultAccessRequest[];
}

function getInitialData(): VaultData {
  return {
    users: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@thegallery.local",
        fullName: "Chief Archivist",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "boopathydharunesh622@gmail.com",
        fullName: "Dharunesh Boopathy",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    inviteCodes: [
      {
        id: "inv_default_01",
        code: "TG-WELCOME-2026",
        role: "MEMBER",
        maxUses: 100,
        usesCount: 0,
        expiresAt: null,
        note: "Initial community access key",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "inv_default_02",
        code: "THEGALLERY-VIP",
        role: "CONTRIBUTOR",
        maxUses: 50,
        usesCount: 0,
        expiresAt: null,
        note: "Contributor archival key",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    accessRequests: [],
  };
}

let inMemoryData: VaultData | null = null;

export function getVaultData(): VaultData {
  if (inMemoryData) return inMemoryData;

  try {
    if (fs.existsSync(VAULT_FILE_PATH)) {
      const raw = fs.readFileSync(VAULT_FILE_PATH, "utf-8");
      inMemoryData = JSON.parse(raw);
    } else {
      inMemoryData = getInitialData();
      saveVaultData(inMemoryData);
    }
  } catch {
    inMemoryData = getInitialData();
  }

  // Ensure boopathydharunesh622@gmail.com and admin@thegallery.local exist as SUPER_ADMIN
  ensureSuperAdmins(inMemoryData!);
  return inMemoryData!;
}

function ensureSuperAdmins(data: VaultData) {
  let changed = false;

  const admin1 = data.users.find(
    (u) => u.email.toLowerCase() === "admin@thegallery.local"
  );
  if (!admin1) {
    data.users.push({
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@thegallery.local",
      fullName: "Chief Archivist",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    changed = true;
  } else if (admin1.role !== "SUPER_ADMIN") {
    admin1.role = "SUPER_ADMIN";
    changed = true;
  }

  const admin2 = data.users.find(
    (u) => u.email.toLowerCase() === "boopathydharunesh622@gmail.com"
  );
  if (!admin2) {
    data.users.push({
      id: "00000000-0000-0000-0000-000000000002",
      email: "boopathydharunesh622@gmail.com",
      fullName: "Dharunesh Boopathy",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    changed = true;
  } else if (admin2.role !== "SUPER_ADMIN") {
    admin2.role = "SUPER_ADMIN";
    changed = true;
  }

  if (changed) {
    saveVaultData(data);
  }
}

export function saveVaultData(data: VaultData): void {
  try {
    const dir = path.dirname(VAULT_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    inMemoryData = data;
  } catch (err) {
    console.error("Failed to save vault data:", err);
  }
}

// ---------------- USER OPERATIONS ----------------

export async function findVaultUserByEmail(email: string): Promise<VaultUser | null> {
  const data = getVaultData();
  const lower = email.toLowerCase().trim();
  const found = data.users.find((u) => u.email.toLowerCase() === lower);
  if (found) {
    if (isSuperAdminEmail(found.email)) {
      found.role = "SUPER_ADMIN";
    }
    return found;
  }
  return null;
}

export async function createVaultUser(params: {
  email: string;
  fullName: string;
  password?: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "CONTRIBUTOR" | "VIEWER";
  status?: "ACTIVE" | "PENDING_SETUP" | "SUSPENDED" | "DEACTIVATED";
  invitedById?: string;
  avatarUrl?: string;
}): Promise<VaultUser> {
  const data = getVaultData();
  const lower = params.email.toLowerCase().trim();
  const isSuper = isSuperAdminEmail(lower);

  let passwordHash = "";
  if (params.password) {
    passwordHash = await bcrypt.hash(params.password, 10);
  }

  const existing = data.users.find((u) => u.email.toLowerCase() === lower);
  if (existing) {
    if (params.password) existing.passwordHash = passwordHash;
    if (params.fullName) existing.fullName = params.fullName;
    if (isSuper) existing.role = "SUPER_ADMIN";
    if (params.status) existing.status = params.status;
    saveVaultData(data);
    return existing;
  }

  const userStatus = isSuper ? "ACTIVE" : (params.status || "PENDING_SETUP");

  const newUser: VaultUser = {
    id: crypto.randomUUID(),
    email: lower,
    fullName: params.fullName,
    passwordHash,
    role: isSuper ? "SUPER_ADMIN" : params.role || "MEMBER",
    status: userStatus,
    createdAt: new Date().toISOString(),
    invitedById: params.invitedById,
    avatarUrl: params.avatarUrl,
  };

  data.users.push(newUser);
  saveVaultData(data);
  return newUser;
}

export function updateVaultUserStatus(
  userId: string,
  status: "ACTIVE" | "PENDING_SETUP" | "SUSPENDED" | "DEACTIVATED"
): boolean {
  const data = getVaultData();
  const user = data.users.find((u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (!user) return false;
  user.status = status;
  saveVaultData(data);
  return true;
}

// ---------------- INVITE CODE OPERATIONS ----------------

export function listVaultInviteCodes(): VaultInviteCode[] {
  const data = getVaultData();
  return [...data.inviteCodes].reverse();
}

export function createVaultInviteCode(params: {
  code?: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "CONTRIBUTOR" | "VIEWER";
  maxUses?: number;
  note?: string;
  expiresInDays?: number;
  createdById?: string;
}): VaultInviteCode {
  const data = getVaultData();
  const code = (
    params.code ||
    `TG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
  ).trim().toUpperCase();

  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86400000).toISOString()
    : null;

  const newInvite: VaultInviteCode = {
    id: `inv_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    code,
    role: params.role || "MEMBER",
    maxUses: params.maxUses || 1,
    usesCount: 0,
    expiresAt,
    note: params.note || "Created via Admin Console",
    createdAt: new Date().toISOString(),
    createdById: params.createdById,
  };

  data.inviteCodes.push(newInvite);
  saveVaultData(data);
  return newInvite;
}

export function validateAndConsumeInviteCode(code: string): {
  valid: boolean;
  role?: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "CONTRIBUTOR" | "VIEWER";
  error?: string;
} {
  const data = getVaultData();
  const upper = code.trim().toUpperCase();
  const invite = data.inviteCodes.find((i) => i.code.toUpperCase() === upper);

  if (!invite) {
    return { valid: false, error: "INVALID_CODE: Invite code does not exist." };
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { valid: false, error: "EXPIRED_CODE: This invite code has expired." };
  }

  if (invite.usesCount >= invite.maxUses) {
    return {
      valid: false,
      error: "DEPLETED_CODE: This invite code has reached its maximum uses.",
    };
  }

  invite.usesCount += 1;
  saveVaultData(data);
  return { valid: true, role: invite.role };
}

// ---------------- ACCESS REQUEST OPERATIONS ----------------

export function listVaultAccessRequests(status?: string): VaultAccessRequest[] {
  const data = getVaultData();
  if (!status || status === "ALL") {
    return [...data.accessRequests].reverse();
  }
  return data.accessRequests
    .filter((r) => r.status === status)
    .reverse();
}

export function createVaultAccessRequest(params: {
  fullName: string;
  email: string;
  collegeBatch?: string;
  collegeYear?: number;
  notes?: string;
}): VaultAccessRequest {
  const data = getVaultData();
  const lower = params.email.toLowerCase().trim();

  const existing = data.accessRequests.find(
    (r) => r.email.toLowerCase() === lower && r.status === "PENDING"
  );
  if (existing) {
    return existing;
  }

  const req: VaultAccessRequest = {
    id: crypto.randomUUID(),
    fullName: params.fullName.trim(),
    email: lower,
    collegeBatch: params.collegeBatch,
    collegeYear: params.collegeYear,
    notes: params.notes,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  data.accessRequests.push(req);
  saveVaultData(data);
  return req;
}

export function reviewVaultAccessRequest(params: {
  requestId: string;
  action: "APPROVE" | "REJECT";
  reviewedById?: string;
  rejectionReason?: string;
}): { success: boolean; request?: VaultAccessRequest; inviteCode?: string; error?: string } {
  const data = getVaultData();
  const req = data.accessRequests.find((r) => r.id === params.requestId);

  if (!req) {
    return { success: false, error: "Access request not found" };
  }

  req.reviewedAt = new Date().toISOString();
  req.reviewedById = params.reviewedById;

  if (params.action === "REJECT") {
    req.status = "REJECTED";
    req.rejectionReason = params.rejectionReason || "Verification requirements not met";
    saveVaultData(data);
    return { success: true, request: req };
  }

  // Action: APPROVE
  req.status = "APPROVED";
  // Generate dedicated invite code for the approved member
  const code = `TG-APPROVED-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const invite = createVaultInviteCode({
    code,
    role: "MEMBER",
    maxUses: 1,
    note: `Approved access for ${req.fullName} (${req.email})`,
    createdById: params.reviewedById,
  });

  req.generatedInviteCode = invite.code;

  // Also auto-create user in vault so they can log in directly if they choose
  createVaultUser({
    email: req.email,
    fullName: req.fullName,
    role: "MEMBER",
    invitedById: params.reviewedById,
  }).catch(() => {});

  saveVaultData(data);
  return { success: true, request: req, inviteCode: invite.code };
}
