"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPortalBackground } from "@/components/user/UserPortalUI";

type TestAttempt = {
    id: string;
    classId: string;
    subjectId: string;
    testRefId: string;
    className: string;
    subjectName: string;
    testName: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    durationSeconds: number;
    createdAt: string;
};

type ClassItem = {
    _id: string;
    name: string;
    status: "locked" | "pending" | "approved" | "rejected";
};

export default function UserDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [history, setHistory] = useState<TestAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalExams: 0,
        averageScore: 0,
        highScore: 0,
    });
    const [testClasses, setTestClasses] = useState<ClassItem[]>([]);
    const [noteClasses, setNoteClasses] = useState<ClassItem[]>([]);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/user/dashboard-data");
                if (!res.ok) {
                    if (res.status === 401) {
                        router.push("/login");
                        return;
                    }
                    throw new Error("Failed to load dashboard data.");
                }
                const data = await res.json();
                
                setUser(data.user || null);
                const list: TestAttempt[] = data.submissions || [];
                setHistory(list);
                setTestClasses(data.testClasses || []);
                setNoteClasses(data.noteClasses || []);

                if (list.length > 0) {
                    const total = list.length;
                    const avg = parseFloat(
                        (list.reduce((sum, item) => sum + item.percentage, 0) / total).toFixed(1)
                    );
                    const max = Math.max(...list.map((item) => item.percentage));
                    setStats({
                        totalExams: total,
                        averageScore: avg,
                        highScore: max,
                    });
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    if (loading) {
        return (
            <UserPortalBackground>
                <div className="min-h-screen flex flex-col justify-center items-center gap-4 relative z-10">
                    <svg className="animate-spin h-10 w-10 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-400 text-sm animate-pulse">Loading your student portal...</p>
                </div>
            </UserPortalBackground>
        );
    }

    const hasHistory = history.length > 0;

    return (
        <UserPortalBackground>
            <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src="/logo.jpeg" alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-md" />
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-[#d4af37] bg-clip-text text-transparent">
                                Ahmad Foundation
                            </span>
                            <span className="text-[10px] bg-[#0f4c81]/30 text-[#d4af37] px-2.5 py-1 rounded-full border border-[#d4af37]/25 font-bold uppercase tracking-wider">
                                Tuition Portal
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Student</p>
                            <p className="text-sm font-bold text-[#d4af37]">{user?.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-400/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 relative z-10 pb-16">
                {/* ── Welcome Header ── */}
                <div className="mb-10 text-center md:text-left">
                    <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-2">
                        Ahmad Foundation Student Hub
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
                        Welcome, <span className="text-[#d4af37]">{user?.name?.split(" ")[0]}</span>!
                    </h1>
                    <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                        Access your online preparation resources below. We have divided the system into two separate portals: the MCQ Test Room for timed tests, and the Study Notes Library for curriculum books.
                    </p>
                </div>

                {/* ── Split Portals Layout ── */}
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    
                    {/* ── PORTAL A: MCQ TEST PRACTICE ROOM ── */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#0f4c81]/30 via-slate-900/80 to-slate-950/95 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute right-0 top-0 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-[60px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/25 flex items-center justify-center text-lg">
                                            ✍️
                                        </div>
                                        <div>
                                            <p className="text-[#d4af37] text-[10px] font-bold uppercase tracking-widest">System 01</p>
                                            <h2 className="text-xl font-black text-white">MCQ Practice & Tests</h2>
                                        </div>
                                    </div>
                                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                                        Prepare for exams by taking timed tests. Standard practice (10 Qs) and Full sessions (50 Qs) are graded securely on the server with active anti-cheating protection.
                                    </p>
                                </div>
                                <Link
                                    href="/user/test"
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8960c] px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-[#d4af37]/20 hover:brightness-110 transition-all text-center"
                                >
                                    Enter Test Practice Room →
                                </Link>
                            </div>
                        </div>

                        {/* Test Class Access Status */}
                        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Test Room Access Status</h3>
                            <div className="space-y-2">
                                {testClasses.length === 0 ? (
                                    <p className="text-xs text-slate-500">No classes registered.</p>
                                ) : (
                                    testClasses.map((cls) => (
                                        <div key={cls._id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                                            <span className="font-bold text-white">Class {cls.name}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                                cls.status === "approved" 
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : cls.status === "pending"
                                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                        : "bg-slate-800 text-slate-400 border-white/5"
                                            }`}>
                                                {cls.status === "approved" ? "Unlocked" : cls.status === "pending" ? "Pending" : "Locked"}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Performance Overview</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Taken", val: stats.totalExams, suffix: "", color: "text-sky-400" },
                                    { label: "Avg Score", val: stats.averageScore, suffix: "%", color: "text-[#d4af37]" },
                                    { label: "Best", val: stats.highScore, suffix: "%", color: "text-emerald-400" }
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-slate-950/60 border border-white/5 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{stat.label}</p>
                                        <p className={`text-lg font-black mt-1 ${stat.color}`}>
                                            {stat.val === 0 ? "—" : `${stat.val}${stat.suffix}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Attempts History */}
                        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Test Attempt History</h3>
                                {hasHistory && (
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                        {history.length} attempt{history.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            {!hasHistory ? (
                                <div className="text-center py-8 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                    <p className="text-xs text-slate-500">No test papers completed yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-white/5">
                                    <table className="w-full text-left text-[11px]">
                                        <thead>
                                            <tr className="border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider bg-white/[0.02]">
                                                <th className="pb-2 pt-2 pl-3">Subject</th>
                                                <th className="pb-2 text-center">Score</th>
                                                <th className="pb-2 text-center">%</th>
                                                <th className="pb-2 pr-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-medium">
                                            {history.slice(0, 5).map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5 transition-all">
                                                    <td className="py-2.5 pl-3">
                                                        <div className="font-bold text-white">{item.subjectName}</div>
                                                        <div className="text-slate-500 text-[9px]">Class {item.className}</div>
                                                    </td>
                                                    <td className="py-2.5 text-center text-slate-300">
                                                        {item.score}/{item.totalQuestions}
                                                    </td>
                                                    <td className="py-2.5 text-center">
                                                        <span className={
                                                            item.percentage >= 80 ? "text-green-400 font-bold" :
                                                            item.percentage >= 50 ? "text-yellow-400 font-bold" : "text-red-400 font-bold"
                                                        }>
                                                            {item.percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {item.testRefId && item.classId && item.subjectId && (
                                                                <Link
                                                                    href={`/user/test?classId=${item.classId}&subjectId=${item.subjectId}&testId=${item.testRefId}`}
                                                                    className="inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg text-[9px] font-bold transition-all"
                                                                >
                                                                    Retry
                                                                </Link>
                                                            )}
                                                            <Link
                                                                href={`/user/result/${item.id}`}
                                                                className="inline-block px-2.5 py-1 bg-[#0f4c81]/30 border border-[#0f4c81]/40 text-sky-200 hover:text-white rounded-lg text-[9px] font-bold transition-all"
                                                            >
                                                                Result
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {history.length > 5 && (
                                        <p className="text-[10px] text-slate-500 text-center py-2 border-t border-white/5">
                                            Only showing last 5 attempts.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── PORTAL B: CLASS STUDY NOTES LIBRARY ── */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#0f4c81]/20 via-slate-900/80 to-slate-950/95 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute right-0 top-0 w-48 h-48 bg-[#0f4c81]/10 rounded-full blur-[60px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-[#0f4c81]/30 border border-[#0f4c81]/40 flex items-center justify-center text-lg">
                                            📚
                                        </div>
                                        <div>
                                            <p className="text-sky-400 text-[10px] font-bold uppercase tracking-widest">System 02</p>
                                            <h2 className="text-xl font-black text-white">Class & Study Notes</h2>
                                        </div>
                                    </div>
                                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                                        View and download official class preparation PDF notes, textbook guides, and summaries uploaded directly by tuition center instructors.
                                    </p>
                                </div>
                                <Link
                                    href="/user/notes"
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#0f4c81]/20 hover:brightness-110 transition-all text-center"
                                >
                                    Enter Study Notes Library →
                                </Link>
                            </div>
                        </div>

                        {/* Notes Class Access Status */}
                        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Notes Library Access Status</h3>
                            <div className="space-y-2">
                                {noteClasses.length === 0 ? (
                                    <p className="text-xs text-slate-500">No classes registered.</p>
                                ) : (
                                    noteClasses.map((cls) => (
                                        <div key={cls._id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                                            <span className="font-bold text-white">Class {cls.name}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                                cls.status === "approved" 
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : cls.status === "pending"
                                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                        : "bg-slate-800 text-slate-400 border-white/5"
                                            }`}>
                                                {cls.status === "approved" ? "Unlocked" : cls.status === "pending" ? "Pending" : "Locked"}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Study Notes Checklist */}
                        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Study Library Features</h3>
                            <ul className="space-y-3 text-xs text-slate-300">
                                <li className="flex gap-2">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span>Teacher-compiled high-quality PDF guides.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span>One-click direct download links.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span>Redeem custom note coupons to unlock syllabus chapters.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span>Instant synchronization with class updates.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Quick Unlock Banner */}
                        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5">
                            <h4 className="text-xs font-black text-amber-400 mb-1">Need premium note access?</h4>
                            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                                Certain class notes are locked for verified accounts. Redeem your coupon or request access manually from the Study Notes page.
                            </p>
                            <Link
                                href="/user/notes"
                                className="text-[#d4af37] text-xs font-bold hover:underline"
                            >
                                Unlock Class Notes →
                            </Link>
                        </div>
                    </div>

                </div>
            </main>
        </UserPortalBackground>
    );
}
