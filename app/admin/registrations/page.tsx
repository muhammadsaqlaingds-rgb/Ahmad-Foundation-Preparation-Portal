"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";

type SubmissionItem = {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    title: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    durationSeconds: number;
};

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/admin/registrations");
            const data = await res.json();
            if (res.ok && data.success) {
                setSubmissions(data.data || []);
            } else {
                setError(data.message || "Failed to load submissions.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch test submissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchSubmissions();
    }, []);

    const handleDelete = async (id: string, name: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete the test submission of "${name}" for "${title}"?`)) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);
            const res = await fetch(`/api/admin/registrations/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to delete submission.");
                return;
            }

            setSuccess(`Successfully deleted submission of ${name} for ${title}.`);
            await fetchSubmissions();
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Failed to delete submission.");
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const filteredSubmissions = submissions.filter((sub) => {
        const query = searchQuery.toLowerCase();
        return (
            sub.name.toLowerCase().includes(query) ||
            sub.email.toLowerCase().includes(query) ||
            sub.title.toLowerCase().includes(query)
        );
    });

    // Calculate summary stats
    const totalSubmissions = submissions.length;
    const avgScore = submissions.length > 0 
        ? Math.round(submissions.reduce((acc, sub) => acc + sub.percentage, 0) / submissions.length) 
        : 0;
    const highScorers = submissions.filter(sub => sub.percentage >= 80).length;

    return (
        <AdminShell title="Test Submissions" subtitle="Review and Manage Student Quiz Scores & Submissions">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-indigo-600">{totalSubmissions}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Total Submissions</p>
                    <p className="text-xs text-slate-500 mt-1">All time test attempts</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-emerald-600">{avgScore}%</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Average Score</p>
                    <p className="text-xs text-slate-500 mt-1">Across all submissions</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-amber-600">{highScorers}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">High Scorers</p>
                    <p className="text-xs text-slate-500 mt-1">Above 80% marks</p>
                </div>
            </div>

            {/* Notifications */}
            {(error || success) && (
                <div className="mb-6">
                    {error && (
                        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-emerald-600">{success}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Search Submissions
                        </label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                                placeholder="Search by student name, email, or test title..."
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchSubmissions}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-50">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Submissions Log
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'record' : 'records'} found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
                        <p className="text-sm text-slate-500 mt-4">Loading submissions...</p>
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400">No test submissions found</p>
                        <p className="text-xs text-slate-400 mt-1">Submissions will appear here once students take tests</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-4 pl-6 pr-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Test Details
                                    </th>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Percentage
                                    </th>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Submitted At
                                    </th>
                                    <th className="text-right py-4 pr-6 pl-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSubmissions.map((sub) => (
                                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-4 pl-6 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                                                    <span className="text-indigo-600 font-bold text-sm">
                                                        {sub.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700 text-sm">{sub.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{sub.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <span className="font-medium text-slate-600 text-sm">{sub.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-bold text-slate-700">
                                                {sub.score} / {sub.totalQuestions}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                sub.percentage >= 80 
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : sub.percentage >= 50
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-red-50 text-red-700"
                                            }`}>
                                                {sub.percentage}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-slate-600">{formatDuration(sub.durationSeconds)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs text-slate-500">{formatDate(sub.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-6 pl-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(sub._id, sub.name, sub.title)}
                                                className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Delete Submission"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}