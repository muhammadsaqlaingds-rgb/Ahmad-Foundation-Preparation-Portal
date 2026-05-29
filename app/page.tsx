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
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Background decoration elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0f4c81]/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#d4af37]/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-5000"></div>

            {/* Header */}
            <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <img src="/logo.jpeg" alt="Logo" className="w-14 h-14 rounded-2xl object-cover shadow-md border border-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-[#d4af37] bg-clip-text text-transparent tracking-tight">
                            Ahmad Foundation
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded bg-[#d4af37]/5">
                            Tuition Portal
                        </span>
                    </div>
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
                                className="text-xs font-bold bg-[#d4af37] hover:bg-[#b8960c] text-slate-950 px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
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

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 space-y-24">
                
                {/* 1. Hero Area */}
                <section className="text-center space-y-8 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 backdrop-blur-md text-xs font-bold text-[#d4af37]">
                        <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
                        Prepare Smart · Practice Better
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
                        The Ultimate Tuition Portal For{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#d4af37]">
                            Notes & MCQ Tests
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Ahmad Foundation tuition student dashboard. Download curriculum-aligned PDF chapters and practice timed mock exams with instant performance grading.
                    </p>

                    <div className="flex justify-center pt-2">
                        <Link
                            href={isLoggedIn ? "/user/dashboard" : "/login"}
                            className="w-full sm:w-auto relative group overflow-hidden px-8 py-4 rounded-xl font-bold text-sm shadow-xl transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8960c]"></div>
                            <span className="relative flex items-center justify-center gap-2 text-slate-950 font-black">
                                {isLoggedIn ? "Access Your Student Hub" : "Get Started as Student"}
                                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </Link>
                    </div>
                </section>

                {/* 2. Split Features (What does it contain?) */}
                <section className="space-y-6 animate-fadeIn">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-white">What Does This Portal Contain?</h2>
                        <p className="text-slate-400 text-xs sm:text-sm">Two complete systems engineered to help you succeed in your exams.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* System 1 Card */}
                        <div className="bg-gradient-to-br from-[#0f4c81]/25 via-slate-900/60 to-slate-950/80 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-[#d4af37]/35 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-[40px] pointer-events-none" />
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/25 flex items-center justify-center text-lg">
                                    ✍️
                                </div>
                                <div>
                                    <span className="text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">System 01</span>
                                    <h3 className="text-lg font-bold text-white">MCQ Practice & Mock Tests</h3>
                                </div>
                            </div>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                                Test your preparation level with timed multiple-choice questions (MCQs). Standard tests contain 10 questions for speed drills, while full sessions simulate actual exam structures (up to 50 questions). Features anti-copy safety and automatic scorecard grading.
                            </p>
                            <ul className="space-y-2 text-xs text-slate-400">
                                <li className="flex gap-2"><span className="text-emerald-400 font-bold">✓</span> Real-time timing mechanism</li>
                                <li className="flex gap-2"><span className="text-emerald-400 font-bold">✓</span> Instant server-side calculation</li>
                                <li className="flex gap-2"><span className="text-emerald-400 font-bold">✓</span> View full scorecards and correct answers</li>
                            </ul>
                        </div>

                        {/* System 2 Card */}
                        <div className="bg-gradient-to-br from-[#0f4c81]/15 via-slate-900/60 to-slate-950/80 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-[#0f4c81]/30 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0f4c81]/10 rounded-full blur-[40px] pointer-events-none" />
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[#0f4c81]/30 border border-[#0f4c81]/40 flex items-center justify-center text-lg">
                                    📚
                                </div>
                                <div>
                                    <span className="text-sky-400 text-[10px] font-bold uppercase tracking-widest">System 02</span>
                                    <h3 className="text-lg font-bold text-white">Tuition Class PDF Notes</h3>
                                </div>
                            </div>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                                Skip the stress of taking notes in class. The notes library contains high-quality study materials, summary guidelines, formulas, and PDF books prepared and verified by Ahmad Foundation teachers. Review and download files directly to your device.
                            </p>
                            <ul className="space-y-2 text-xs text-slate-400">
                                <li className="flex gap-2"><span className="text-emerald-400 font-bold">✓</span> PDF formats compatible with all devices</li>
                                <li className="flex gap-2"><span className="text-emerald-400 font-bold">✓</span> Instant download capability</li>
                                <li className="flex gap-2"><span className="text-emerald-400 font-bold">✓</span> Categorized by class grade and subject</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 3. Steps Guide (How to access tests and papers) */}
                <section className="space-y-8 bg-slate-950/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[80px] pointer-events-none" />
                    <div className="text-center space-y-2 max-w-lg mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-white">How To Access The Portal?</h2>
                        <p className="text-slate-400 text-xs">A simple four-step process to set up your account and start your preparation.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { num: "01", title: "Create Account", desc: "Sign up on the registration page with your name, email, and password to establish your profile." },
                            { num: "02", title: "Select Your Grade", desc: "Inside the dashboard, choose the class level (e.g. Class 9, Class 10) you are studying in." },
                            { num: "03", title: "Unlock Your Class", desc: "Unlock using a tuition-provided coupon code OR by requesting access via payment verification." },
                            { num: "04", title: "Practice & Download", desc: "Attempt standard tests, view instant results, and download teacher-compiled study notes." }
                        ].map((step) => (
                            <div key={step.num} className="bg-slate-950 border border-white/10 rounded-2xl p-5 relative">
                                <div className="absolute top-4 right-4 text-3xl font-black text-white/5 pointer-events-none">{step.num}</div>
                                <div className="h-8 w-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/25 flex items-center justify-center text-xs font-black text-[#d4af37] mb-4">
                                    {step.num}
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Access Modes (Free Coupon vs Premium Payment) */}
                <section className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-white">Access Plans & Unlocking</h2>
                        <p className="text-slate-400 text-xs sm:text-sm">We provide both free community routes and premium support routes for class unlock requests.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-stretch">
                        
                        {/* Route 1: Coupons */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                            <div>
                                <div className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                                    Tuition Students
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">School Coupon Codes</h3>
                                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                                    If you are currently enrolled in Ahmad Foundation tuition programs, you will receive activation coupon codes from your teacher or the tuition administrator. Entering this code on the class setup page provides instant and lifetime access to both MCQ tests and study notes.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-4 text-xs text-slate-400 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                100% Free for tuition students
                            </div>
                        </div>

                        {/* Route 2: Premium Payment */}
                        <div className="bg-slate-900/40 border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                            <div>
                                <div className="inline-block px-2.5 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider mb-4">
                                    Direct Activation
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Manual Premium Access</h3>
                                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                                    If you do not have a coupon, you can request activation by submitting your payment details. Pay the fee via EasyPaisa or JazzCash, copy the Transaction ID or reference information, and submit the request. Administrators will verify the transaction and unlock your class notes and test room.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-4 text-xs text-slate-400 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
                                Activated within 24 hours of submission
                            </div>
                        </div>

                    </div>
                </section>
                
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
