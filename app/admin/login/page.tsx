"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Invalid credentials.");
                setLoading(false);
                return;
            }

            localStorage.setItem("adminLoggedIn", "true");

            router.push("/admin/dashboard");
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white flex items-center justify-center p-4">
            {/* Ambient Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-0 bg-[#020617]/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 relative">
                {/* Left panel - Branding */}
                <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-white/5 to-transparent border-r border-white/5 p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

                    <div className="relative z-10">
                        <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/10 mb-6" />
                        <p className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase mb-4">
                            Ahmad Foundation
                        </p>
                        <h1 className="text-3xl font-black leading-tight text-white mb-4">
                            Admin <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Control Center</span>
                        </h1>
                        <p className="text-sm text-white/60 leading-relaxed max-w-sm">
                            Configure programs, upload new assets, and review applicant registrations quickly and securely from this dashboard.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                            <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-emerald-400 border border-white/10 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </span>
                            <div>
                                <p className="text-sm font-bold text-white mb-0.5">Highly Secure</p>
                                <p className="text-[11px] text-white/50">Only authorized environment variables can grant internal access.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel - Form */}
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                    <div className="mb-8 flex flex-col items-center md:items-start">
                        {/* Mobile Branding (only shows on small screens) */}
                        <div className="md:hidden mb-4">
                            <img src="/logo.jpeg" alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border border-white/10" />
                        </div>
                        <p className="md:hidden text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase mb-2 text-center">
                            Ahmad Foundation
                        </p>

                        <h2 className="text-2xl font-bold text-white md:text-left text-center">
                            Sign in
                        </h2>
                        <p className="mt-2 text-sm text-white/50 md:text-left text-center">
                            Enter your environment credentials.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                placeholder="hello@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-red-400 animate-slideUp text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? "Authenticating..." : "Sign in securely"}
                            {!loading && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
