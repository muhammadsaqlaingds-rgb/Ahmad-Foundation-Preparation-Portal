"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";

type ClassItem = {
    _id: string;
    name: string;
    createdAt?: string;
};

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [name, setName] = useState("");

    useEffect(() => {
        void fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/classes");
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(data.data || []);
            } else {
                setError(data.message || "Failed to load classes.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load classes.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Class name is required.");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to create class.");
            } else {
                setSuccess(`Successfully added Class "${data.data.name}"!`);
                setName("");
                await fetchClasses();
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, className: string) => {
        if (!window.confirm(`Are you sure you want to delete Class "${className}"?\nWARNING: This will soft-delete all subjects and MCQs linked to this class.`)) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);
            const res = await fetch(`/api/classes/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to delete class.");
                return;
            }

            setSuccess(`Class "${className}" and its cascading subjects/MCQs deleted (soft-delete).`);
            await fetchClasses();
        } catch (e) {
            console.error(e);
            setError("Failed to delete class.");
        }
    };

    return (
        <AdminShell title="Class Management" subtitle="Manage Institution Grades / Classes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Card */}
                <section className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-24">
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-indigo-50">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        Add New Class
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Create grade levels or segments for organizing questions. Double-check before submitting.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Class / Grade Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                                        placeholder="e.g. Grade 9, Class 10, A-Level"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                                        <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-red-600">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                        <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-emerald-600">{success}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-200 px-4 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Class"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* List Section */}
                <section className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-50">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                            Active Classes
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchClasses}
                                        className="text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {classes.length} {classes.length === 1 ? 'class' : 'classes'} configured
                                </p>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
                                        <p className="text-sm text-slate-500 mt-4">Loading classes...</p>
                                    </div>
                                ) : classes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-400">No classes have been added yet.</p>
                                        <p className="text-xs text-slate-400 mt-1">Add your first class using the form on the right.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {classes.map((cls) => (
                                            <div
                                                key={cls._id}
                                                className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50/30 to-transparent hover:from-slate-50 hover:border-indigo-200 transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                                                            <span className="text-white font-bold text-sm">
                                                                {cls.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition">
                                                            {cls.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Grade Level</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cls._id, cls.name)}
                                                    className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete Class"
                                                >
                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AdminShell>
    );
}