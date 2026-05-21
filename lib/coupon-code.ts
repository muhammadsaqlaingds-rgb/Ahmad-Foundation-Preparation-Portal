import bcrypt from "bcryptjs";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Readable coupon code, e.g. AF-X7K2M9P4 */
export function generateCouponCode(): string {
    let suffix = "";
    for (let i = 0; i < 8; i++) {
        suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return `AF-${suffix}`;
}

export async function hashCouponCode(raw: string): Promise<string> {
    return bcrypt.hash(raw.trim().toUpperCase(), 10);
}
