import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import GalleryAsset from "@/models/GalleryAsset";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const url = new URL(req.url);
        const featured = url.searchParams.get("featured");

        const query: Record<string, unknown> = {};
        if (featured === "true") {
            query.featuredOnHome = true;
        }

        const assets = await GalleryAsset.find(query)
            .sort(featured === "true" ? { orderOnHome: 1, createdAt: -1 } : { createdAt: -1 })
            .lean();

        // If asking for featured, enforce max 3 in the response
        const limited = featured === "true" ? assets.slice(0, 3) : assets;

        return NextResponse.json({ success: true, data: limited }, { status: 200 });
    } catch (error) {
        console.error("Fetch gallery assets error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load gallery assets." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const body = await req.json();
        const {
            src,
            title,
            alt,
            category,
            type = "image",
            featuredOnHome = false,
        } = body as {
            src?: string;
            title?: string;
            alt?: string;
            category?: string;
            type?: "image" | "video";
            featuredOnHome?: boolean;
        };

        if (!src || !title) {
            return NextResponse.json(
                { success: false, message: "Image path/URL and title are required." },
                { status: 400 }
            );
        }

        let orderOnHome = 0;

        if (featuredOnHome) {
            const featuredCount = await GalleryAsset.countDocuments({
                featuredOnHome: true,
            });
            if (featuredCount >= 3) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "You can only feature up to 3 images on the home spotlight. Remove one first.",
                    },
                    { status: 409 }
                );
            }

            const maxOrderDoc = await GalleryAsset.findOne({ featuredOnHome: true })
                .sort({ orderOnHome: -1 })
                .lean();
            orderOnHome = ((maxOrderDoc as any)?.orderOnHome ?? 0) + 1;
        }

        const created = await GalleryAsset.create({
            src,
            title,
            alt,
            category,
            type,
            featuredOnHome,
            orderOnHome,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Create gallery asset error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create gallery asset." },
            { status: 500 }
        );
    }
}

