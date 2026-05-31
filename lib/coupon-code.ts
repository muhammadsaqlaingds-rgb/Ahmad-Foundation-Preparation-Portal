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

/**
 * Extract the indexed prefix from a raw coupon code.
 * Stored in plaintext so we can query a single document before running bcrypt.
 * Using 8 chars gives 32^8 ≈ 1 trillion combinations — not guessable.
 */
export function extractCodePrefix(raw: string): string {
    return raw.trim().toUpperCase().slice(0, 8);
}

export async function hashCouponCode(raw: string): Promise<string> {
    return bcrypt.hash(raw.trim().toUpperCase(), 10);
}
