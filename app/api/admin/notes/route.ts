import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { put } from "@vercel/blob";

// Helper to sanitize filenames — replaces URL-unsafe characters with underscores
function sanitizeFilename(name: string): string {
  return name.replace(/[#?&=+%\s]/g, "_");
}

/** POST /api/admin/notes */
export async function POST(req: Request) {
  try {
    // ✅ STEP 1: Check BLOB token exists
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log("🔑 BLOB_READ_WRITE_TOKEN present:", !!token);
    if (!token) {
      console.error("❌ BLOB_READ_WRITE_TOKEN is missing from environment variables!");
      return NextResponse.json({ error: "Server config error: Blob token missing" }, { status: 500 });
    }

    // ✅ STEP 2: Parse form data
    console.log("📋 Parsing form data...");
    const form = await req.formData();
    const name = form.get("name") as string;
    const description = form.get("description") as string;
    const classId = form.get("classId") as string;
    const subjectId = form.get("subjectId") as string;
    const requiresCoupon = form.get("requiresCoupon") === "true";
    const imageFile = form.get("image") as File | null;
    const pdfFile = form.get("pdf") as File;

    console.log("📋 Form fields received:", {
      name: name || "MISSING",
      description: description ? "✅" : "MISSING",
      classId: classId || "MISSING",
      subjectId: subjectId || "MISSING",
      pdfFile: pdfFile ? `✅ ${pdfFile.name} (${pdfFile.size} bytes)` : "MISSING",
      imageFile: imageFile ? `✅ ${imageFile.name} (${imageFile.size} bytes)` : "none",
    });

    if (!name || !description || !classId || !subjectId || !pdfFile) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ STEP 3: Connect to DB
    console.log("🗄️ Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected");

    // ✅ STEP 4: Upload PDF to Vercel Blob
    const pdfName = `notes/${Date.now()}_${sanitizeFilename(pdfFile.name)}`;
    console.log("📄 Uploading PDF to Vercel Blob:", pdfName);
    let pdfUrl: string;
    try {
      const pdfBlob = await put(pdfName, pdfFile, { access: "public" });
      pdfUrl = pdfBlob.url;
      console.log("✅ PDF uploaded successfully:", pdfUrl);
    } catch (blobErr: any) {
      console.error("❌ PDF Blob upload failed:", blobErr?.message || blobErr);
      return NextResponse.json({ error: `PDF upload failed: ${blobErr?.message || "Blob error"}` }, { status: 500 });
    }

    // ✅ STEP 5: Upload optional image to Vercel Blob
    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const imgName = `notes/${Date.now()}_${sanitizeFilename(imageFile.name)}`;
      console.log("🖼️ Uploading image to Vercel Blob:", imgName);
      try {
        const imgBlob = await put(imgName, imageFile, { access: "public" });
        imageUrl = imgBlob.url;
        console.log("✅ Image uploaded successfully:", imageUrl);
      } catch (imgErr: any) {
        console.error("❌ Image Blob upload failed:", imgErr?.message || imgErr);
        return NextResponse.json({ error: `Image upload failed: ${imgErr?.message || "Blob error"}` }, { status: 500 });
      }
    }

    // ✅ STEP 6: Save to MongoDB
    console.log("💾 Saving note to MongoDB...");
    const newNote = await Note.create({
      name,
      description,
      imageUrl,
      pdfUrl,
      classId,
      subjectId,
      requiresCoupon,
    });
    console.log("✅ Note saved to MongoDB:", newNote._id);

    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Admin notes POST error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to create note" }, { status: 500 });
  }
}

import "@/models/Class";
import "@/models/Subject";

/** GET /api/admin/notes */
export async function GET() {
  try {
    await connectToDatabase();
    const notes = await Note.find({ isDeleted: { $ne: true } })
      .populate("classId", "name")
      .populate("subjectId", "name")
      .select("_id name description imageUrl pdfUrl classId subjectId requiresCoupon createdAt")
      .lean();
    return NextResponse.json({ success: true, notes });
  } catch (err) {
    console.error("Admin notes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

/** PUT /api/admin/notes/:id */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing note id" }, { status: 400 });
    const body = await req.json();
    await connectToDatabase();
    const updated = await Note.findByIdAndUpdate(id, body, { new: true }).lean();
    return NextResponse.json({ success: true, note: updated });
  } catch (err) {
    console.error("Admin notes PUT error:", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

/** DELETE /api/admin/notes/:id */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing note id" }, { status: 400 });
    await connectToDatabase();
    await Note.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin notes DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
