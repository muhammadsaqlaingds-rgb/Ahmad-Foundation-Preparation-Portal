import { Schema, model, models } from "mongoose";

const GalleryAssetSchema = new Schema(
    {
        src: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        alt: {
            type: String,
            default: "",
        },
        category: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["image", "video"],
            default: "image",
        },
        featuredOnHome: {
            type: Boolean,
            default: false,
        },
        orderOnHome: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const GalleryAsset = models.GalleryAsset || model("GalleryAsset", GalleryAssetSchema);

export default GalleryAsset;
