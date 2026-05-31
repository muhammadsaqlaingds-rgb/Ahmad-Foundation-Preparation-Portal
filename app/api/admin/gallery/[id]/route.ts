import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import GalleryAsset from "@/models/GalleryAsset";
import { requireAdmin } from "@/lib/admin";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function PUT(req: Request, { params }: Params) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();

        const {
            src,
            title,
            alt,
            category,
            type,
            featuredOnHome,
        } = body as {
            src?: string;
            title?: string;
            alt?: string;
            category?: string;
            type?: "image" | "video";
            featuredOnHome?: boolean;
        };

        const existing = await GalleryAsset.findById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Gallery item not found." },
                { status: 404 }
            );
        }

        // Handle featured toggle with max 3 rule
        if (typeof featuredOnHome === "boolean") {
            if (featuredOnHome && !existing.featuredOnHome) {
                const featuredCount = await GalleryAsset.countDocuments({
                    featuredOnHome: true,
                    _id: { $ne: id },
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
                existing.orderOnHome = ((maxOrderDoc as any)?.orderOnHome ?? 0) + 1;
            }

            if (!featuredOnHome) {
                existing.featuredOnHome = false;
                existing.orderOnHome = 0;
            } else {
                existing.featuredOnHome = true;
            }
        }

        if (typeof src === "string") existing.src = src;
        if (typeof title === "string") existing.title = title;
        if (typeof alt === "string") existing.alt = alt;
        if (typeof category === "string") existing.category = category;
        if (typeof type === "string") existing.type = type as any;

        const updated = await existing.save();

        return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch (error) {
        console.error("Update gallery asset error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update gallery asset." },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const { id } = await params;

        const deleted = await GalleryAsset.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Gallery item not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Delete gallery asset error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete gallery asset." },
            { status: 500 }
        );
    }
}

