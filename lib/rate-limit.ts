type RateLimitInfo = {
    count: number;
    resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitInfo>();

/**
 * Perform an IP-based rate limit check.
 * @param ip IP address of the client
 * @param limit Maximum allowed requests in the window
 * @param windowSeconds Window length in seconds
 * @returns Object indicating if the client is limited and the time to retry in seconds
 */
export function isRateLimited(
    ip: string,
    limit: number,
    windowSeconds: number
): { limited: boolean; retryAfter: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Preventive garbage collection of expired sessions to prevent memory leaks
    if (rateLimitMap.size > 1000) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (now > val.resetTime) {
                rateLimitMap.delete(key);
            }
        }
    }

    const current = rateLimitMap.get(ip);

    if (!current || now > current.resetTime) {
        // Initialize or reset the window for this IP
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { limited: false, retryAfter: 0 };
    }

    current.count += 1;

    if (current.count > limit) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        return { limited: true, retryAfter: Math.max(1, retryAfter) };
    }

    return { limited: false, retryAfter: 0 };
}
