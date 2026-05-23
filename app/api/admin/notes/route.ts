import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import path from "path";
import fs from "fs/promises";

// Helper to ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = path.resolve(process.cwd(), "public", "uploads", "notes");
  await fs.mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

/** POST /api/admin/notes */
export async function POST(req: Request) {
  try {
    // Parse multipart/form-data
    const form = await req.formData();
    const name = form.get("name") as string;
    const description = form.get("description") as string;
    const classId = form.get("classId") as string;
    const subjectId = form.get("subjectId") as string;
    const requiresCoupon = form.get("requiresCoupon") === "true";
    const imageFile = form.get("image") as File | null;
    const pdfFile = form.get("pdf") as File;

    if (!name || !description || !classId || !subjectId || !pdfFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();
    const uploadDir = await ensureUploadDir();

    // Save PDF
    const pdfName = `${Date.now()}_${pdfFile.name}`;
    const pdfPath = path.join(uploadDir, pdfName);
    const pdfData = Buffer.from(await pdfFile.arrayBuffer());
    await fs.writeFile(pdfPath, pdfData);
    const pdfUrl = `/uploads/notes/${pdfName}`;

    // Save optional image
    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const imgName = `${Date.now()}_${imageFile.name}`;
      const imgPath = path.join(uploadDir, imgName);
      const imgData = Buffer.from(await imageFile.arrayBuffer());
      await fs.writeFile(imgPath, imgData);
      imageUrl = `/uploads/notes/${imgName}`;
    }

    const newNote = await Note.create({
      name,
      description,
      imageUrl,
      pdfUrl,
      classId,
      subjectId,
      requiresCoupon,
    });

    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (err) {
    console.error("Admin notes POST error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
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
