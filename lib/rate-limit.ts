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
export async function isRateLimited(
    ip: string,
    limit: number,
    windowSeconds: number
): Promise<{ limited: boolean; retryAfter: number }> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        try {
            const key = `rate:${ip}`;
            // Use Upstash Redis REST pipeline to increment and fetch TTL in a single HTTP request
            const res = await fetch(`${url}/pipeline`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([
                    ["INCR", key],
                    ["TTL", key]
                ]),
                // Abort request if it takes too long to avoid blocking API responses
                signal: AbortSignal.timeout(2000)
            });

            if (res.ok) {
                const results = await res.json();
                const count = results[0]?.error ? 0 : (results[0]?.result || 0);
                let ttl = results[1]?.error ? -1 : (results[1]?.result || -1);

                // Set expiration if the key is newly created or lacks TTL
                if (count === 1 || ttl === -1) {
                    await fetch(`${url}/expire/${key}/${windowSeconds}`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    ttl = windowSeconds;
                }

                if (count > limit) {
                    return { limited: true, retryAfter: ttl > 0 ? ttl : windowSeconds };
                }
                return { limited: false, retryAfter: 0 };
            }
        } catch (err) {
            console.error("Upstash Redis rate limit error, falling back to in-memory:", err);
        }
    }

    // Fallback: In-memory Rate Limiter
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
