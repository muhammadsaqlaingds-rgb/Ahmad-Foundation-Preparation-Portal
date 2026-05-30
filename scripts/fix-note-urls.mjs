/**
 * fix-note-urls.mjs
 * One-time migration: sanitizes pdfUrl and imageUrl fields in the Note collection
 * by replacing URL-unsafe characters (#, ?, &, +, spaces) with underscores,
 * and renames the corresponding files on disk to match.
 *
 * Usage:  node scripts/fix-note-urls.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Manually load .env
try {
  const env = readFileSync(path.join(ROOT, ".env"), "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env not found */ }

const UPLOAD_DIR = path.join(ROOT, "public", "uploads", "notes");

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("❌  MONGODB_URI is not set in .env");
  process.exit(1);
}

/** Replace URL-unsafe characters with underscores */
function sanitizeUrl(url) {
  if (!url) return url;
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const safe = filename.replace(/[#?&=+%\s]/g, "_");
  if (filename === safe) return url; // no change needed
  parts[parts.length - 1] = safe;
  return parts.join("/");
}

async function renameIfNeeded(oldUrl, newUrl) {
  if (oldUrl === newUrl) return;
  const oldFilename = decodeURIComponent(oldUrl.split("/").pop());
  const newFilename = newUrl.split("/").pop();
  const oldPath = path.join(UPLOAD_DIR, oldFilename);
  const newPath = path.join(UPLOAD_DIR, newFilename);
  try {
    await fs.access(oldPath); // check exists
    await fs.rename(oldPath, newPath);
    console.log(`  ✅  Renamed: "${oldFilename}" → "${newFilename}"`);
  } catch {
    // If the old file doesn't exist, the new file may already be in place
    try {
      await fs.access(newPath);
      console.log(`  ℹ️   Already renamed: "${newFilename}"`);
    } catch {
      console.warn(`  ⚠️  File not found on disk: "${oldFilename}" — skipping rename`);
    }
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("✅  Connected to MongoDB");

  const db = client.db();
  const notes = db.collection("notes");

  const allNotes = await notes.find({}).toArray();
  console.log(`\n🔍  Checking ${allNotes.length} note(s) for unsafe URLs...\n`);

  let fixed = 0;

  for (const note of allNotes) {
    const newPdfUrl = sanitizeUrl(note.pdfUrl);
    const newImageUrl = sanitizeUrl(note.imageUrl);

    const changed = newPdfUrl !== note.pdfUrl || newImageUrl !== note.imageUrl;
    if (!changed) continue;

    console.log(`📄  Note: "${note.name}" (${note._id})`);

    if (newPdfUrl !== note.pdfUrl) {
      console.log(`  PDF:   "${note.pdfUrl}" → "${newPdfUrl}"`);
      await renameIfNeeded(note.pdfUrl, newPdfUrl);
    }
    if (note.imageUrl && newImageUrl !== note.imageUrl) {
      console.log(`  Image: "${note.imageUrl}" → "${newImageUrl}"`);
      await renameIfNeeded(note.imageUrl, newImageUrl);
    }

    await notes.updateOne(
      { _id: note._id },
      { $set: { pdfUrl: newPdfUrl, imageUrl: newImageUrl } }
    );

    fixed++;
  }

  await client.close();

  if (fixed === 0) {
    console.log("✅  All note URLs are already clean. Nothing to fix.");
  } else {
    console.log(`\n✅  Migration complete. Fixed ${fixed} note(s).`);
  }
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
