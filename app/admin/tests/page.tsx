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
    classId: string | any;
};

type TestItem = {
    _id: string;
    name: string;
    classId: { _id: string; name: string } | null;
    subjectId: { _id: string; name: string } | null;
    createdAt?: string;
};

export default function AdminTestsPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [tests, setTests] = useState<TestItem[]>([]);
    
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [testName, setTestName] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const classRes = await fetch("/api/classes");
                const classData = await classRes.json();
                if (classRes.ok && classData.success) {
                    setClasses(classData.data || []);
                }
                
                const subjectRes = await fetch("/api/subjects");
                const subjectData = await subjectRes.json();
                if (subjectRes.ok && subjectData.success) {
                    setSubjects(subjectData.data || []);
                }

                await fetchTests();
            } catch (e) {
                console.error(e);
                setError("Failed to load initial data.");
            } finally {
                setLoading(false);
            }
        };

        void loadInitialData();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await fetch("/api/admin/tests");
            const data = await res.json();
            if (res.ok && data.success) {
                setTests(data.data || []);
            }
        } catch (e) {
            console.error("Fetch tests error:", e);
        }
    };

    const handleClassChange = (classId: string) => {
        setSelectedClass(classId);
        setSelectedSubject("");
    };

    const filteredSubjects = subjects.filter((sub) => {
        const subClassId = typeof sub.classId === "object" && sub.classId !== null ? sub.classId._id : sub.classId;
        return subClassId === selectedClass;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedClass) {
            setError("Please select a Class.");
            return;
        }

        if (!selectedSubject) {
            setError("Please select a Subject.");
            return;
        }

        if (!testName.trim()) {
            setError("Test name is required.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: testName.trim(),
                    classId: selectedClass,
                    subjectId: selectedSubject,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to create test.");
            } else {
                setSuccess(`Successfully added Test "${data.data.name}"!`);
                setTestName("");
                await fetchTests();
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${name}"?\nWARNING: This will soft-delete all MCQs associated with this test.`
            )
        ) {
            return;
        }

        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`/api/admin/tests/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to delete test.");
            } else {
                setSuccess(`Test "${name}" and its cascading MCQs soft-deleted.`);
                await fetchTests();
            }
        } catch (e) {
            console.error(e);
            setError("Failed to delete test.");
        }
    };

    return (
        <AdminShell title="Test Management" subtitle="Configure mock exams and tests under subjects">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Card */}
                <section className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-24">
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-300" />
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-violet-50">
                                        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        Create New Test
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Create tests under specific subjects (e.g., Test 1, Mid-Term, Final Exam).
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Select Class
                                    </label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                                    >
                                        <option value="">-- Choose Class --</option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                Grade {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Select Subject
                                    </label>
                                    <select
                                        value={selectedSubject}
                                        disabled={!selectedClass}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- Choose Subject --</option>
                                        {filteredSubjects.map((sub) => (
                                            <option key={sub._id} value={sub._id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedClass && filteredSubjects.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            No subjects available for this class
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Test Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Test 1, Mid-Term, Final"
                                        value={testName}
                                        onChange={(e) => setTestName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
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
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 shadow-md shadow-violet-200 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-violet-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Test"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Tests List Section */}
                <section className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-50">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                                Existing Tests Registry
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {tests.length} {tests.length === 1 ? 'test' : 'tests'} configured
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchTests}
                                        className="text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
                                        <p className="text-sm text-slate-500 mt-4">Loading tests...</p>
                                    </div>
                                ) : tests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-400">No tests found.</p>
                                        <p className="text-xs text-slate-400 mt-1">Create your first test using the form on the right.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Test Name
                                                    </th>
                                                    <th className="text-left pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Class
                                                    </th>
                                                    <th className="text-left pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Subject
                                                    </th>
                                                    <th className="text-right pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {tests.map((item) => (
                                                    <tr key={item._id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="py-4 pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                </div>
                                                                <span className="font-semibold text-slate-700 text-sm">
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 pr-4">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                                </svg>
                                                                Grade {item.classId?.name || "Deleted"}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 pr-4">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 text-xs font-medium text-violet-600">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                </svg>
                                                                {item.subjectId?.name || "Deleted"}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <button
                                                                onClick={() => handleDelete(item._id, item.name)}
                                                                className="px-3 py-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-xs font-medium flex items-center gap-1.5 ml-auto"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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