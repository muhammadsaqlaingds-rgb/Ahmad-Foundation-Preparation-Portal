"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    setIsLoggedIn(true);
                }
            } catch (err) {
                console.error("Session check error:", err);
            } finally {
                setLoading(false);
            }
        };
        void checkSession();
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                setIsLoggedIn(false);
                router.refresh();
            }
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Background decoration elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0f4c81]/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d4af37]/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-5000"></div>

            {/* Header */}
            <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-[#d4af37] bg-clip-text text-transparent tracking-tight">
                        Ahmad Foundation
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded bg-[#d4af37]/5">
                        Quiz Portal
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-t-slate-400 border-white/10 rounded-full animate-spin" />
                    ) : isLoggedIn ? (
                        <>
                            <Link
                                href="/user/dashboard"
                                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-xl transition-all shadow-md shadow-red-950/20 cursor-pointer"
                            >
                                Log Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="text-xs font-bold bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] hover:from-[#115894] hover:to-[#227db3] px-4 py-2 rounded-xl transition-all shadow-md shadow-sky-950/20"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Main Hero */}
            <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center py-20">
                <div className="max-w-3xl space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-bold text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Mock Exams & Timed Practice Online
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
                        Master Your Concepts With{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-[#e0c068] to-[#d4af37]">
                            Precision MCQ Quizzes
                        </span>
                    </h1>

                    <p className="text-sm sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                        A fast, secure, and interactive mock examination environment. Solve curated question pools, track your speed, and review instant scorecard analytics.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href={isLoggedIn ? "/user/dashboard" : "/login"}
                            className="w-full sm:w-auto relative group overflow-hidden px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8960c]"></div>
                            <span className="relative flex items-center justify-center gap-2 text-slate-950 font-black">
                                {isLoggedIn ? "Go to Dashboard" : "Get Started as Student"}
                                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </Link>
                        <Link
                            href="/admin/login"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm font-semibold"
                        >
                            Access Admin Panel
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                <p>© {new Date().getFullYear()} Ahmad Foundation Educational Trust. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <span className="hover:text-slate-400 transition cursor-help">Terms</span>
                    <span className="hover:text-slate-400 transition cursor-help">Privacy Policy</span>
                    <span className="hover:text-slate-400 transition cursor-help">Support</span>
                </div>
            </footer>
        </div>
    );
}
