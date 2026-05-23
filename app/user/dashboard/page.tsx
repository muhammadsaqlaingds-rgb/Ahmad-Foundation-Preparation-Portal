"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    UserPortalBackground,
    EmptyHistoryCard,
    StatCard,
    TestPaperIllustration,
} from "@/components/user/UserPortalUI";

type TestAttempt = {
    id: string;
    className: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    durationSeconds: number;
    createdAt: string;
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
                const userRes = await fetch("/api/auth/me");
                if (!userRes.ok) {
                    if (userRes.status === 401) {
                        router.push("/login");
                        return;
                    }
                    throw new Error("Failed to load user info.");
                }
                const userData = await userRes.json();
                setUser(userData.user);

                const histRes = await fetch("/api/user/submissions");
                if (histRes.ok) {
                    const histData = await histRes.json();
                    const list: TestAttempt[] = histData.submissions || [];
                    setHistory(list);

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
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-[#d4af37] bg-clip-text text-transparent">
                            Ahmad Foundation
                        </span>
                        <span className="text-[10px] bg-[#0f4c81]/30 text-[#d4af37] px-2.5 py-1 rounded-full border border-[#d4af37]/25 font-bold uppercase tracking-wider">
                            Tuition Portal
                        </span>
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 relative z-10">
                <div className="grid lg:grid-cols-5 gap-8 mb-10">
                    <div className="lg:col-span-3 bg-gradient-to-br from-[#0f4c81]/40 via-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                                Online Test Papers · Tuition Students
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">
                                Welcome, <span className="text-[#d4af37]">{user?.name?.split(" ")[0]}</span>
                            </h1>
                            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed mb-6">
                                Practice with real-style MCQ test papers for your class and subject. Track scores, improve weak areas, and prepare for exams with Ahmad Foundation.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/user/test"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8960c] px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-[#d4af37]/20 hover:brightness-110 transition-all"
                                >
                                    Start Mock Test
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/user/notes"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#0f4c81]/20 hover:brightness-110 transition-all"
                                >
                                    Browse Class Notes
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </Link>
                                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Secure timed exams
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 flex items-center justify-center">
                        <TestPaperIllustration />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { icon: "1", title: "Choose class", desc: "Select your grade level" },
                                { icon: "2", title: "Pick subject", desc: "Math, Science & more" },
                                { icon: "3", title: "Take test", desc: "Timed MCQ practice" },
                            ].map((item) => (
                                <div
                                    key={item.icon}
                                    className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-center"
                                >
                                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#0f4c81]/30 text-sm font-black text-[#d4af37]">
                                        {item.icon}
                                    </div>
                                    <p className="text-sm font-bold text-white">{item.title}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Test Paper History
                                </h3>
                                {hasHistory && (
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {history.length} attempt{history.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            {!hasHistory ? (
                                <EmptyHistoryCard />
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-white/5">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider bg-white/[0.02]">
                                                <th className="pb-3 pt-3 pl-4">Subject / Grade</th>
                                                <th className="pb-3 text-center">Score</th>
                                                <th className="pb-3 text-center">%</th>
                                                <th className="pb-3 text-center">Time</th>
                                                <th className="pb-3 pr-4 text-right">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-medium">
                                            {history.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5 transition-all">
                                                    <td className="py-4 pl-4">
                                                        <div className="text-sm font-bold text-white">{item.subjectName}</div>
                                                        <div className="text-slate-400 text-[10px]">Class {item.className}</div>
                                                    </td>
                                                    <td className="py-4 text-center text-slate-300">
                                                        {item.score}/{item.totalQuestions}
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                                item.percentage >= 80
                                                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                                    : item.percentage >= 50
                                                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                            }`}
                                                        >
                                                            {item.percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-center text-slate-400">
                                                        {Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s
                                                    </td>
                                                    <td className="py-4 pr-4 text-right">
                                                        <Link
                                                            href={`/user/result/${item.id}`}
                                                            className="inline-block px-3 py-1.5 bg-[#0f4c81]/30 border border-[#0f4c81]/40 text-sky-200 hover:text-white hover:bg-[#d4af37]/20 hover:border-[#d4af37]/30 rounded-lg text-[10px] font-bold transition-all"
                                                        >
                                                            View Scorecard
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-black text-white mb-1">Performance</h3>
                            <p className="text-[11px] text-slate-500 mb-5">Updates after each mock test</p>
                            <div className="space-y-3">
                                <StatCard
                                    label="Tests Taken"
                                    value={stats.totalExams}
                                    accent="blue"
                                    emptyHint="Complete your first test"
                                />
                                <StatCard
                                    label="Average Score"
                                    value={stats.averageScore}
                                    suffix="%"
                                    accent="gold"
                                    emptyHint="No scores yet"
                                />
                                <StatCard
                                    label="Best Score"
                                    value={stats.highScore}
                                    suffix="%"
                                    accent="green"
                                    emptyHint="Beat your record"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/10 to-transparent p-6">
                            <h4 className="text-sm font-black text-white mb-2">Need class access?</h4>
                            <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                                Locked grades require premium access via WhatsApp or a coupon code from your teacher.
                            </p>
                            <Link
                                href="/user/test"
                                className="text-[#d4af37] text-xs font-bold hover:underline"
                            >
                                Go to Practice Room →
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <h4 className="text-xs font-black text-emerald-400 mb-2 flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Fair testing
                            </h4>
                            <p className="text-slate-500 text-[10px] leading-relaxed">
                                Answers are graded on the server. Copy/paste and inspect tools are disabled during exams.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </UserPortalBackground>
    );
}
