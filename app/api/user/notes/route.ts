import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import ClassAccess from "@/models/ClassAccess";
import NoteAccess from "@/models/NoteAccess";
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
    
    // Check if class is unlocked for this user
    const classAccess = await ClassAccess.findOne({ userId: user._id, classId }).lean();
    const hasClassAccess = classAccess && classAccess.status === "approved";

    // Get all notes for this class/subject
    const notes = await Note.find({
      classId,
      subjectId,
      isDeleted: { $ne: true },
    })
      .lean()
      .select("_id name description imageUrl pdfUrl requiresCoupon");

    // Get user's note access records
    const noteAccessRecords = await NoteAccess.find({
      userId: user._id,
      classId,
      subjectId,
    }).lean();

    const accessedNoteIds = new Set(noteAccessRecords.map((na: any) => na.noteId.toString()));

    // Map notes with access status
    const notesWithAccess = notes.map((note: any) => {
      const noteId = note._id.toString();
      const hasNoteAccess = accessedNoteIds.has(noteId);
      
      // User can access if:
      // 1. They have class access AND note doesn't require coupon, OR
      // 2. They have specific note access (via coupon)
      const isUnlocked = (hasClassAccess && !note.requiresCoupon) || hasNoteAccess;

      return {
        _id: note._id,
        name: note.name,
        description: note.description,
        imageUrl: note.imageUrl,
        pdfUrl: note.pdfUrl,
        requiresCoupon: note.requiresCoupon,
        isUnlocked,
      };
    });

    return NextResponse.json({ success: true, notes: notesWithAccess });
  } catch (err) {
    console.error("User notes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
