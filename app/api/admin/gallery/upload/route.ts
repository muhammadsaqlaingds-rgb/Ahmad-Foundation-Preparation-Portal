import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided." },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });

        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const filename = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.writeFile(filePath, buffer);

        const urlPath = `/uploads/${filename}`;

        return NextResponse.json(
            { success: true, url: urlPath },
            { status: 201 }
        );
    } catch (error) {
        console.error("Gallery upload error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to upload file." },
            { status: 500 }
        );
    }
}

