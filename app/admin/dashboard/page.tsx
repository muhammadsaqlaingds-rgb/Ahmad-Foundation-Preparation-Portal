"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/app/admin/AdminShell";

type RecentSubmission = {
    _id: string;
    name: string;
    createdAt: string;
    title: string;
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const [classesCount, setClassesCount] = useState<number | null>(null);
    const [mcqCount, setMcqCount] = useState<number | null>(null);
    const [submissionsCount, setSubmissionsCount] = useState<number | null>(null);
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [classesRes, mcqRes, subRes] = await Promise.all([
                    fetch("/api/classes"),
                    fetch("/api/mcqs?limit=1"),
                    fetch("/api/admin/registrations"),
                ]);

                const [classesData, mcqData, subData] = await Promise.all([
                    classesRes.json(),
                    mcqRes.json(),
                    subRes.json(),
                ]);

                if (classesData.success) {
                    setClassesCount(classesData.data?.length || 0);
                }
                if (mcqData.success) {
                    setMcqCount(mcqData.pagination?.total || 0);
                }
                if (subData.success) {
                    const allSubs = subData.data || [];
                    setSubmissionsCount(allSubs.length);
                    setRecentSubmissions(allSubs.slice(0, 4));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (typeof window !== "undefined") {
            void fetchDashboardData();
        }
    }, []);

    const quickStats = [
        {
            label: "Test Submissions",
            value: submissionsCount !== null ? submissionsCount : "...",
            badge: "Completed",
            color: "text-emerald-700 bg-emerald-50 border-emerald-200",
            icon: (
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            label: "Active Classes",
            value: classesCount !== null ? classesCount : "...",
            badge: "Academic Grades",
            color: "text-indigo-700 bg-indigo-50 border-indigo-200",
            icon: (
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            label: "Manage Exam Questions",
            value: mcqCount !== null ? mcqCount : "...",
            badge: "Active MCQs",
            color: "text-amber-700 bg-amber-50 border-amber-200",
            icon: (
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
        },
    ];

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    return (
        <AdminShell title="Dashboard" subtitle="Overview & Statistics">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {quickStats.map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative bg-white rounded-2xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 border border-slate-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50" />
                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm">
                                    {stat.icon}
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${stat.color}`}>
                                    {stat.badge}
                                </span>
                            </div>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">
                                {loading ? (
                                    <span className="inline-block w-12 h-8 bg-slate-100 rounded animate-pulse" />
                                ) : (
                                    stat.value
                                )}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Submissions */}
                <section className="lg:col-span-2 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-transparent" />
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-50">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Recent Test Submissions
                                </h3>
                            </div>
                            <button
                                onClick={() => router.push('/admin/registrations')}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                            >
                                View All →
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                                <p className="text-sm text-slate-500 mt-3">Loading data...</p>
                            </div>
                        ) : recentSubmissions.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-400">No recent test submissions</p>
                            </div>
                        ) : (
                            recentSubmissions.map((sub, idx) => (
                                <div
                                    key={sub._id}
                                    onClick={() => router.push('/admin/registrations')}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform`}>
                                                {sub.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ${idx === 0 ? 'block' : 'hidden'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
                                                {sub.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-xs text-slate-400">{formatDate(sub.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                            {sub.title || "General Test"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Quick Actions
                            </h3>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        <button
                            onClick={() => router.push('/admin/classes')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50/30 to-transparent hover:from-indigo-50 hover:border-indigo-200 transition-all group text-left"
                        >
                            <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-700">Manage Classes</p>
                                <p className="text-xs text-slate-400 mt-0.5">Add, edit, or delete grade levels</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => router.push('/admin/subjects')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-amber-50/30 to-transparent hover:from-amber-50 hover:border-amber-200 transition-all group text-left"
                        >
                            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-700">Manage Subjects</p>
                                <p className="text-xs text-slate-400 mt-0.5">Configure subjects per class</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => router.push('/admin/mcqs')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50/30 to-transparent hover:from-emerald-50 hover:border-emerald-200 transition-all group text-left"
                        >
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-700">Manage Questions</p>
                                <p className="text-xs text-slate-400 mt-0.5">View, edit, or delete questions</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => router.push('/admin/mcqs/add')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-violet-50/30 to-transparent hover:from-violet-50 hover:border-violet-200 transition-all group text-left"
                        >
                            <div className="p-2.5 rounded-lg bg-violet-100 text-violet-600 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-700">Add New MCQs</p>
                                <p className="text-xs text-slate-400 mt-0.5">Create and upload questions</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </section>
            </div>
        </AdminShell>
    );
}