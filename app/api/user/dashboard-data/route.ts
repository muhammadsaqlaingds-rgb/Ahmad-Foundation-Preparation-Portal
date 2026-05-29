import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TestSubmission from "@/models/TestSubmission";
import Class from "@/models/Class";
import ClassAccess from "@/models/ClassAccess";
import NoteClassAccess from "@/models/NoteClassAccess";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        // Enforce user authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        await connectToDatabase();

        // Perform all read operations in parallel using Promise.all with .lean() for optimal millisecond speed
        const [submissions, classes, classAccesses, noteClassAccesses] = await Promise.all([
            // 1. Fetch user test attempts (capped at 10, newest first)
            TestSubmission.find({ userId: user._id })
                .populate("classId", "name")
                .populate("subjectId", "name")
                .populate("testId", "name")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean() as Promise<any[]>,

            // 2. Fetch all active classes
            Class.find({ isDeleted: { $ne: true } })
                .sort({ name: 1 })
                .lean() as Promise<any[]>,

            // 3. Fetch user class accesses
            ClassAccess.find({ userId: user._id }).lean() as Promise<any[]>,

            // 4. Fetch user notes access
            NoteClassAccess.find({ userId: user._id }).lean() as Promise<any[]>
        ]);

        // Format submissions history
        const formattedSubmissions = submissions.map((sub) => ({
            id: sub._id.toString(),
            classId: sub.classId?._id?.toString() || "",
            subjectId: sub.subjectId?._id?.toString() || "",
            testRefId: sub.testId?._id?.toString() || "",
            className: sub.classId?.name || "Class Deleted",
            subjectName: sub.testId?.name
                ? `${sub.subjectId?.name || "Subject Deleted"} (${sub.testId.name})`
                : sub.subjectId?.name || "Subject Deleted",
            testName: sub.testId?.name || "",
            score: sub.score,
            totalQuestions: sub.totalQuestions,
            percentage: sub.percentage,
            durationSeconds: sub.durationSeconds,
            createdAt: sub.createdAt,
        }));

        // Format Test Room classes
        const testAccessMap = new Map<string, string>();
        classAccesses.forEach((acc) => {
            testAccessMap.set(acc.classId.toString(), acc.status);
        });
        const testClassesWithStatus = classes.map((cls) => ({
            _id: cls._id.toString(),
            name: cls.name,
            status: testAccessMap.get(cls._id.toString()) || "locked",
        }));

        // Format Notes Library classes
        const notesAccessMap = new Map<string, string>();
        noteClassAccesses.forEach((acc) => {
            notesAccessMap.set(acc.classId.toString(), acc.status);
        });
        const noteClassesWithStatus = classes.map((cls) => ({
            _id: cls._id.toString(),
            name: cls.name,
            status: notesAccessMap.get(cls._id.toString()) || "locked",
        }));

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
            },
            submissions: formattedSubmissions,
            testClasses: testClassesWithStatus,
            noteClasses: noteClassesWithStatus,
        });
    } catch (err) {
        console.error("Dashboard Data GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve dashboard data." }, { status: 500 });
    }
}
