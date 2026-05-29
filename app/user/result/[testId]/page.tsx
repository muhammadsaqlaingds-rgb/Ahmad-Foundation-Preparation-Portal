"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type ScoreSummary = {
    testId: string;
    totalQuestions: number;
    attemptedCount: number;
    score: number;
    percentage: number;
    durationSeconds: number;
    className: string;
    subjectName: string;
    createdAt: string;
    realClassId?: string;
    realSubjectId?: string;
    realTestId?: string;
};

export default function UserResultPage() {
    const params = useParams();
    const router = useRouter();
    const testId = params?.testId as string;

    const [summary, setSummary] = useState<ScoreSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!testId) return;

        const fetchResults = async () => {
            try {
                // 1. Verify User is Authenticated
                const meRes = await fetch("/api/auth/me");
                if (!meRes.ok) {
                    router.push("/login");
                    return;
                }

                // 2. Fetch secure results summary
                const res = await fetch(`/api/tests/${testId}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load test scorecard.");
                }

                setSummary(data.summary);
            } catch (err: any) {
                setError(err.message || "Failed to load scorecard details.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [testId, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-400 text-sm animate-pulse">Evaluating and processing scorecard...</p>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 max-w-md text-center">
                    <h3 className="text-lg font-black mb-2">Scorecard Access Error</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        {error || "We could not find the scorecard for the requested mock exam."}
                    </p>
                    <Link
                        href="/user/dashboard"
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all inline-block"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const { percentage, score, totalQuestions, attemptedCount, durationSeconds, className, subjectName } = summary;

    // Determine color coding depending on grade percentage
    const isPass = percentage >= 50;
    const isExcellent = percentage >= 80;

    const gaugeColor = isExcellent
        ? "text-emerald-500"
        : isPass
        ? "text-yellow-500"
        : "text-red-500";

    const gaugeTrackColor = "stroke-slate-800";

    // SVG Gauge configurations
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-[#d4af37]/30 pb-20 relative overflow-hidden flex flex-col justify-center py-12">
            {/* Animated Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0f4c81]/15 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d4af37]/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-xl w-full mx-auto px-4 relative z-10">
                {/* Scorecard Container */}
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    {/* Badge */}
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 border border-white/10 px-3 py-1 rounded-full">
                            Practice scorecard
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black mt-3 bg-gradient-to-r from-white to-[#d4af37] bg-clip-text text-transparent">
                            Exam Report
                        </h2>
                    </div>

                    {/* Animated SVG Circle Score Gauge */}
                    <div className="flex justify-center items-center mb-8 relative">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Track Ring */}
                                <circle
                                    cx="96"
                                    cy="96"
                                    r={radius}
                                    className={gaugeTrackColor}
                                    strokeWidth="12"
                                    fill="transparent"
                                />
                                {/* Value Ring */}
                                <circle
                                    cx="96"
                                    cy="96"
                                    r={radius}
                                    className={`${gaugeColor} transition-all duration-1000 ease-out`}
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* Centered percentage content */}
                            <div className="absolute text-center">
                                <span className="text-4xl font-black tabular-nums tracking-tight block">
                                    {percentage}%
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5 block">
                                    {isExcellent ? "Excellent!" : isPass ? "Passed" : "Needs Review"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Class */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Class</span>
                            <span className="text-sm font-bold text-white mt-1 block">{className}</span>
                        </div>

                        {/* Subject */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Subject</span>
                            <span className="text-sm font-bold text-[#d4af37] mt-1 block">{subjectName}</span>
                        </div>

                        {/* Questions count */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Score Summary</span>
                            <span className="text-sm font-bold text-white mt-1 block">
                                {score} <span className="text-slate-500 font-medium">/ {totalQuestions} Correct</span>
                            </span>
                        </div>

                        {/* Attempted */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Questions Attempted</span>
                            <span className="text-sm font-bold text-white mt-1 block">
                                {attemptedCount} <span className="text-slate-500 font-medium">/ {totalQuestions}</span>
                            </span>
                        </div>

                        {/* Duration */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 col-span-2 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duration Taken</span>
                                <span className="text-sm font-bold text-white mt-1 block">
                                    {Math.floor(durationSeconds / 60)} minutes {durationSeconds % 60} seconds
                                </span>
                            </div>
                            <div className="text-slate-500 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {/* Retry same test */}
                        {summary.realClassId && summary.realSubjectId && summary.realTestId && (
                            <Link
                                href={`/user/test?classId=${summary.realClassId}&subjectId=${summary.realSubjectId}&testId=${summary.realTestId}`}
                                className="flex-1 relative overflow-hidden group py-3 text-slate-950 font-bold text-xs rounded-xl cursor-pointer text-center shadow-lg transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8960c]"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center justify-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Retry This Test</span>
                                </span>
                            </Link>
                        )}

                        <Link
                            href="/user/test"
                            className="flex-1 relative overflow-hidden group py-3 text-white font-bold text-xs rounded-xl cursor-pointer text-center shadow-lg transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f]"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8960c] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center justify-center gap-1.5">
                                <span>Take Another Exam</span>
                                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </Link>

                        <Link
                            href="/user/dashboard"
                            className="px-6 py-3 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/5 text-xs font-bold rounded-xl cursor-pointer text-center transition-all"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
