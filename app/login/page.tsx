"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to log in. Please try again.");
            }

            // Success redirect to User Dashboard
            router.push("/user/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during sign in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden px-4 py-12">
            {/* Animated Gradient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0f4c81]/25 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d4af37]/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-5000"></div>

            {/* Back to Home Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-all group z-10"
            >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </Link>

            {/* Glassmorphic Login Card */}
            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
                {/* Logo and Headings */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black tracking-tight mb-2">
                        <span className="bg-gradient-to-r from-white via-slate-200 to-[#d4af37] bg-clip-text text-transparent">
                            Student Sign In
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Sign in to access your practice rooms and scorecards
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            placeholder="student@ahmadfoundation.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81] transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="password" className="block text-slate-300 text-xs font-bold uppercase tracking-wider">
                                Password
                            </label>
                        </div>
                        <input
                            type="password"
                            id="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81] transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative overflow-hidden group py-3.5 text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg transition-all pt-2"
                    >
                        {/* Background Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f]"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8960c] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <span className="relative flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </>
                            )}
                        </span>
                    </button>
                </form>

                {/* Footer redirect */}
                <div className="mt-6 text-center border-t border-white/5 pt-4 text-sm text-slate-400">
                    Don't have a student account?{" "}
                    <Link href="/register" className="text-[#d4af37] hover:underline font-semibold">
                        Register Here
                    </Link>
                </div>
            </div>
        </div>
    );
}
