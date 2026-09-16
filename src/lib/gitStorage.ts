import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import sharp from "sharp";
import crypto from "crypto";

const execAsync = promisify(exec);

const STORAGE_REPO_PATH = process.env.STORAGE_REPO_PATH
  ? path.resolve(process.env.STORAGE_REPO_PATH)
  : path.resolve(process.cwd(), ".storage_repo");

export interface GroupStorageParams {
  groupId: string;
  name: string;
  description?: string | null;
  ownerName?: string;
  type?: string;
}

export interface SaveMediaParams {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  groupId?: string | null;
  groupName?: string | null;
  uploaderName?: string;
  visibilityMode?: string;
}

export interface StoredMediaResult {
  storageKey: string;
  thumbnailKey: string | null;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  sha256Hash: string;
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";
}

// Serial operation queue to guarantee thread-safe git commit and push sequences
let gitQueue = Promise.resolve();

export function queueGitTask<T>(task: () => Promise<T>): Promise<T> {
  const result = gitQueue.then(task, task);
  gitQueue = result.then(
    () => {},
    () => {}
  );
  return result;
}

/**
 * Executes a git command within the storage repository directory.
 */
export async function runGitCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const res = await execAsync(cmd, {
      cwd: STORAGE_REPO_PATH,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: 30000,
    });
    return res;
  } catch (err: any) {
    console.error(`Git command failed [${cmd}]:`, err.message);
    throw err;
  }
}

/**
 * Pushes committed changes cleanly to remote storage_gallery.git via serial queue
 */
export function triggerGitPush(): Promise<void> {
  return queueGitTask(async () => {
    try {
      await runGitCommand("git pull --rebase origin main");
      await runGitCommand("git push origin main");
    } catch (err: any) {
      console.warn("Git storage remote sync notice:", err.message);
    }
  });
}


/**
 * Ensures the group folder structure and metadata files exist in Git storage,
 * commits the changes, and pushes to remote.
 */
export async function createGroupInStorage({
  groupId,
  name,
  description,
  ownerName = "Member",
  type = "CUSTOM",
}: GroupStorageParams): Promise<{ groupDir: string; groupPath: string }> {
  const sanitized = sanitizeName(name);
  const groupDir = `${sanitized}_${groupId.slice(0, 8)}`;
  const groupPath = path.join(STORAGE_REPO_PATH, "groups", groupDir);

  const photosDir = path.join(groupPath, "photos");
  const videosDir = path.join(groupPath, "videos");
  const derivativesDir = path.join(groupPath, "derivatives");

  await fs.promises.mkdir(photosDir, { recursive: true });
  await fs.promises.mkdir(videosDir, { recursive: true });
  await fs.promises.mkdir(derivativesDir, { recursive: true });

  // 1. Write group metadata JSON
  const meta = {
    id: groupId,
    name,
    description: description || "",
    type,
    owner: ownerName,
    createdAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(
    path.join(groupPath, "group.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );

  // 2. Write descriptive README.md
  const readmeContent = `# Circle: ${name}

- **Circle ID:** \`${groupId}\`
- **Category / Type:** ${type}
- **Owner:** ${ownerName}
- **Created At:** ${new Date().toISOString()}

### Description
${description || "No description provided."}

### Storage Inventory
- \`photos/\` — Original quality photograph archives
- \`videos/\` — Master resolution video recordings
- \`derivatives/\` — High-speed WebP previews and compressed thumbnails
`;
  await fs.promises.writeFile(path.join(groupPath, "README.md"), readmeContent, "utf-8");

  // Keep git tracking empty subdirs
  await fs.promises.writeFile(path.join(photosDir, ".gitkeep"), "# photos\n", "utf-8");
  await fs.promises.writeFile(path.join(videosDir, ".gitkeep"), "# videos\n", "utf-8");
  await fs.promises.writeFile(path.join(derivativesDir, ".gitkeep"), "# derivatives\n", "utf-8");

  // 3. Git commit & push
  queueGitTask(async () => {
    try {
      await runGitCommand(`git add "groups/${groupDir}"`);
      const status = await runGitCommand("git status --porcelain");
      if (status.stdout.trim()) {
        await runGitCommand(
          `git commit -m "feat(group): initialize circle '${name.replace(/"/g, "'")}' [${groupId.slice(0, 8)}]"`
        );
        await runGitCommand("git pull --rebase origin main");
        await runGitCommand("git push origin main");
      }
    } catch (gitErr: any) {
      console.warn("Git commit for group creation completed with notes:", gitErr.message);
    }
  });



  return { groupDir, groupPath };
}

/**
 * Finds an existing group directory by group ID in storage_gallery
 */
export async function findGroupStorageDir(groupId: string): Promise<string | null> {
  const groupsRoot = path.join(STORAGE_REPO_PATH, "groups");
  if (!fs.existsSync(groupsRoot)) return null;

  const entries = await fs.promises.readdir(groupsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const metaPath = path.join(groupsRoot, entry.name, "group.json");
      if (fs.existsSync(metaPath)) {
        try {
          const content = await fs.promises.readFile(metaPath, "utf-8");
          const data = JSON.parse(content);
          if (data.id === groupId) {
            return entry.name;
          }
        } catch {
          // ignore corrupted json
        }
      }
      if (entry.name.endsWith(`_${groupId.slice(0, 8)}`)) {
        return entry.name;
      }
    }
  }
  return null;
}

/**
 * Saves uploaded photo or video to storage_gallery.git
 * Automatically creates thumbnails for images, commits, and pushes to GitHub.
 */
export async function saveMediaToGitStorage({
  buffer,
  originalFilename,
  mimeType,
  groupId,
  groupName,
  uploaderName = "Archivist",
}: SaveMediaParams): Promise<StoredMediaResult> {
  const isVideo = mimeType.startsWith("video/");
  const isImage = mimeType.startsWith("image/");
  const subCategory = isVideo ? "videos" : "photos";

  // Calculate SHA-256 hash
  const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Determine target directory inside storage_repo
  let targetRelativeDir: string;
  let derivativesRelativeDir: string;

  if (groupId) {
    let groupDir = await findGroupStorageDir(groupId);
    if (!groupDir) {
      const created = await createGroupInStorage({
        groupId,
        name: groupName || `Circle ${groupId.slice(0, 6)}`,
      });
      groupDir = created.groupDir;
    }
    targetRelativeDir = path.join("groups", groupDir, subCategory);
    derivativesRelativeDir = path.join("groups", groupDir, "derivatives");
  } else {
    targetRelativeDir = path.join("public", subCategory);
    derivativesRelativeDir = path.join("public", "derivatives");
  }

  const absoluteTargetDir = path.join(STORAGE_REPO_PATH, targetRelativeDir);
  const absoluteDerivativesDir = path.join(STORAGE_REPO_PATH, derivativesRelativeDir);

  await fs.promises.mkdir(absoluteTargetDir, { recursive: true });
  await fs.promises.mkdir(absoluteDerivativesDir, { recursive: true });

  // Generate unique clean filename
  const cleanBase = path.parse(originalFilename).name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = path.parse(originalFilename).ext || (isVideo ? ".mp4" : ".jpg");
  const uniquePrefix = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const storedFilename = `${uniquePrefix}_${cleanBase}${ext}`;

  const absoluteFilePath = path.join(absoluteTargetDir, storedFilename);
  const storageKey = path.posix.join(targetRelativeDir.replace(/\\/g, "/"), storedFilename);

  // Write raw original buffer
  await fs.promises.writeFile(absoluteFilePath, buffer);

  let width: number | undefined;
  let height: number | undefined;
  let thumbnailKey: string | null = null;

  // If image, generate WebP thumbnail variant
  if (isImage) {
    try {
      const img = sharp(buffer);
      const metadata = await img.metadata();
      width = metadata.width;
      height = metadata.height;

      const thumbFilename = `${uniquePrefix}_${cleanBase}_thumb.webp`;
      const absoluteThumbPath = path.join(absoluteDerivativesDir, thumbFilename);

      const thumbBuffer = await sharp(buffer)
        .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      await fs.promises.writeFile(absoluteThumbPath, thumbBuffer);
      thumbnailKey = path.posix.join(
        derivativesRelativeDir.replace(/\\/g, "/"),
        thumbFilename
      );
    } catch (sharpErr) {
      console.warn("Could not generate WebP thumbnail:", sharpErr);
    }
  }

  // Commit and push to storage_gallery.git via serial queue
  queueGitTask(async () => {
    try {
      const filesToStage = [
        `"${storageKey.replace(/\\/g, "/")}"`,
        thumbnailKey ? `"${thumbnailKey.replace(/\\/g, "/")}"` : "",
      ].filter(Boolean).join(" ");

      await runGitCommand(`git add ${filesToStage}`);
      const status = await runGitCommand("git status --porcelain");
      if (status.stdout.trim()) {
        const commitMsg = `feat(media): upload '${originalFilename.replace(/"/g, "'")}' into ${groupName || "Public Vault"} (by ${uploaderName})`;
        await runGitCommand(`git commit -m "${commitMsg}"`);
        await runGitCommand("git pull --rebase origin main");
        await runGitCommand("git push origin main");
      }
    } catch (gitErr: any) {
      console.warn("Git commit for media upload completed with notes:", gitErr.message);
    }
  });



  return {
    storageKey,
    thumbnailKey,
    fileSizeBytes: buffer.length,
    width,
    height,
    sha256Hash,
  };
}

/**
 * Retrieves buffer and mime-type for a stored key from storage_repo
 */
export async function getGitStorageBuffer(
  storageKey: string
): Promise<{ buffer: Buffer; exists: boolean }> {
  // Normalize path to prevent directory traversal
  const safeRelative = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
  const absolutePath = path.join(STORAGE_REPO_PATH, safeRelative);

  if (!fs.existsSync(absolutePath)) {
    return { buffer: Buffer.alloc(0), exists: false };
  }

  const buffer = await fs.promises.readFile(absolutePath);
  return { buffer, exists: true };
}

/**
 * Checks if a file exists in the storage repository
 */
export async function gitStorageObjectExists(storageKey: string): Promise<boolean> {
  const safeRelative = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
  const absolutePath = path.join(STORAGE_REPO_PATH, safeRelative);
  return fs.existsSync(absolutePath);
}

/**
 * Deletes a media file and its derivatives from storage_repo, commits, and pushes
 */
export async function deleteGitStorageObject(storageKey: string): Promise<void> {
  const safeRelative = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
  const absolutePath = path.join(STORAGE_REPO_PATH, safeRelative);

  if (fs.existsSync(absolutePath)) {
    await fs.promises.unlink(absolutePath);
    try {
      await runGitCommand(`git add "${safeRelative}"`);
      await runGitCommand(`git commit -m "fix(media): remove '${path.basename(storageKey)}'"`);
      triggerGitPush();
    } catch (err: any) {
      console.warn("Git commit for delete completed with notes:", err.message);
    }
  }
}
