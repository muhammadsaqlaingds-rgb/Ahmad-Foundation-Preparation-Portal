"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";

type ClassItem = {
    _id: string;
    name: string;
};

type SubjectItem = {
    _id: string;
    name: string;
    classId: {
        _id: string;
        name: string;
    };
    createdAt?: string;
};

export default function AdminSubjectsPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form inputs
    const [selectedClassId, setSelectedClassId] = useState("");
    const [subjectName, setSubjectName] = useState("");

    // Filter state
    const [filterClassId, setFilterClassId] = useState("");

    useEffect(() => {
        void loadInitialData();
    }, []);

    // Trigger reload when filter changes
    useEffect(() => {
        if (!loading) {
            void fetchSubjects(filterClassId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterClassId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [classesRes, subjectsRes] = await Promise.all([
                fetch("/api/classes"),
                fetch("/api/subjects"),
            ]);

            const classesData = await classesRes.json();
            const subjectsData = await subjectsRes.json();

            if (classesRes.ok && classesData.success) {
                setClasses(classesData.data || []);
            }
            if (subjectsRes.ok && subjectsData.success) {
                setSubjects(subjectsData.data || []);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load classes and subjects.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async (classId?: string) => {
        try {
            setError(null);
            const url = classId ? `/api/subjects?classId=${classId}` : "/api/subjects";
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok && data.success) {
                setSubjects(data.data || []);
            } else {
                setError(data.message || "Failed to load subjects.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load subjects.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId) {
            setError("Please select a class.");
            return;
        }
        if (!subjectName.trim()) {
            setError("Subject name is required.");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: subjectName.trim(),
                    classId: selectedClassId,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to create subject.");
            } else {
                const targetClassName = classes.find(c => c._id === selectedClassId)?.name || "";
                setSuccess(`Successfully added Subject "${data.data.name}" for Class "${targetClassName}"!`);
                setSubjectName("");
                await fetchSubjects(filterClassId);
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete Subject "${name}"?\nWARNING: This will soft-delete all MCQs linked to this subject.`)) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);
            const res = await fetch(`/api/subjects/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to delete subject.");
                return;
            }

            setSuccess(`Subject "${name}" and its linked MCQs soft-deleted successfully.`);
            await fetchSubjects(filterClassId);
        } catch (e) {
            console.error(e);
            setError("Failed to delete subject.");
        }
    };

    return (
        <AdminShell title="Subject Management" subtitle="Create and Link Educational Course Subjects">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Card */}
                <section className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-24">
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-emerald-50">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        Add New Subject
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Create subjects associated with a specific class level (e.g., Physics for Grade 9).
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Class / Grade
                                    </label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                                    >
                                        <option value="" className="text-slate-500">-- Select Class --</option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                Grade {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Subject Name
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectName}
                                        onChange={(e) => setSubjectName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                                        placeholder="e.g., Mathematics, Physics, English"
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
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-200 px-4 py-2.5 text-sm font-semibold text-white hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Subject"
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
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300" />
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-sky-50">
                                            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                                Subjects List
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} found
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            value={filterClassId}
                                            onChange={(e) => setFilterClassId(e.target.value)}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
                                        >
                                            <option value="">All Classes</option>
                                            {classes.map((cls) => (
                                                <option key={cls._id} value={cls._id}>
                                                    Grade {cls.name}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => fetchSubjects(filterClassId)}
                                            className="text-sm text-slate-500 hover:text-sky-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-sky-50 transition-colors flex items-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-sky-600 animate-spin" />
                                        <p className="text-sm text-slate-500 mt-4">Loading subjects...</p>
                                    </div>
                                ) : subjects.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            {filterClassId
                                                ? "No subjects found under this class."
                                                : "No subjects have been created yet."}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {filterClassId
                                                ? "Try selecting a different class or create a new subject."
                                                : "Add your first subject using the form on the right."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {subjects.map((subj) => (
                                            <div
                                                key={subj._id}
                                                className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50/30 to-transparent hover:from-slate-50 hover:border-sky-200 transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-200 group-hover:scale-105 transition-transform">
                                                            <span className="text-white font-bold text-sm">
                                                                {subj.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-700 text-sm group-hover:text-sky-600 transition">
                                                            {subj.name}
                                                        </p>
                                                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-500 mt-1 font-medium">
                                                            Grade {subj.classId?.name || "Deleted Class"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(subj._id, subj.name)}
                                                    className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete Subject"
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