"use client";

import { useState } from "react";

type NoteClassCouponRedeemProps = {
    classId: string;
    onSuccess: () => void;
};

export default function NoteClassCouponRedeem({ classId, onSuccess }: NoteClassCouponRedeemProps) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) {
            setError("Please enter a coupon code.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/user/redeem-note-class-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId, code: trimmed }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to redeem coupon.");
                return;
            }

            setCode("");
            onSuccess();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Class Notes Coupon Code
                </label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value);
                        setError(null);
                    }}
                    placeholder="Enter your class notes coupon code"
                    disabled={submitting}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f4c81] disabled:opacity-50"
                />
            </div>

            {error && (
                <p className="text-xs font-semibold text-red-400">{error}</p>
            )}

            <button
                type="submit"
                disabled={submitting || !code.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] hover:from-[#d4af37] hover:to-[#b8960c] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {submitting ? "Redeeming..." : "Unlock All Class Notes"}
            </button>
        </form>
    );
}
