import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import ClassAccess from "@/models/ClassAccess";
import NoteClassAccess from "@/models/NoteClassAccess";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/user/notes?classId=...&subjectId=... */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    if (!classId || !subjectId) {
      return NextResponse.json({ error: "Missing classId or subjectId" }, { status: 400 });
    }

    await connectToDatabase();

    // Check class-level access in parallel —
    // either via ClassAccess (MCQ/test access) OR NoteClassAccess (note coupon)
    const [classAccess, noteClassAccess] = await Promise.all([
      ClassAccess.findOne({ userId: user._id, classId, status: "approved" }).lean(),
      NoteClassAccess.findOne({ userId: user._id, classId, status: "approved" }).lean(),
    ]);

    const hasAccess = !!(classAccess || noteClassAccess);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. Unlock this class first." },
        { status: 403 }
      );
    }

    // Access is class-level — return ALL notes for this subject, no per-note filtering
    const notes = await Note.find({
      classId,
      subjectId,
      isDeleted: { $ne: true },
    })
      .lean()
      .select("_id name description imageUrl pdfUrl");

    return NextResponse.json({ success: true, notes });
  } catch (err) {
    console.error("User notes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
