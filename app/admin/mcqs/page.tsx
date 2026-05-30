"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";
import { renderFormattedText } from "@/lib/mathFormatter";

type ClassItem = {
    _id: string;
    name: string;
};

type SubjectItem = {
    _id: string;
    name: string;
};

type TestItem = {
    _id: string;
    name: string;
};

type MCQItem = {
    _id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    classId: {
        _id: string;
        name: string;
    };
    subjectId: {
        _id: string;
        name: string;
    };
    testId: {
        _id: string;
        name: string;
    } | null;
    createdAt?: string;
};

export default function AdminMcqListPage() {
    const [mcqs, setMcqs] = useState<MCQItem[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [tests, setTests] = useState<TestItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedTestId, setSelectedTestId] = useState("");
    const [searchVal, setSearchVal] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    const [editingMcq, setEditingMcq] = useState<MCQItem | null>(null);
    const [editQuestion, setEditQuestion] = useState("");
    const [editOptions, setEditOptions] = useState<string[]>(["", "", "", ""]);
    const [editCorrectAnswer, setEditCorrectAnswer] = useState<number>(0);
    const [editClassId, setEditClassId] = useState("");
    const [editSubjectId, setEditSubjectId] = useState("");
    const [editTestId, setEditTestId] = useState("");
    
    const [editSubjects, setEditSubjects] = useState<SubjectItem[]>([]);
    const [editTests, setEditTests] = useState<TestItem[]>([]);
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        void loadClasses();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchVal);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchVal]);

    useEffect(() => {
        if (selectedClassId) {
            void loadSubjects(selectedClassId, false);
        } else {
            setSubjects([]);
            setSelectedSubjectId("");
            setTests([]);
            setSelectedTestId("");
        }
        setPage(1);
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedClassId && selectedSubjectId) {
            void loadTests(selectedClassId, selectedSubjectId, false);
        } else {
            setTests([]);
            setSelectedTestId("");
        }
        setPage(1);
    }, [selectedSubjectId]);

    useEffect(() => {
        if (editClassId) {
            void loadSubjects(editClassId, true);
        } else {
            setEditSubjects([]);
            setEditSubjectId("");
            setEditTests([]);
            setEditTestId("");
        }
    }, [editClassId]);

    useEffect(() => {
        if (editClassId && editSubjectId) {
            void loadTests(editClassId, editSubjectId, true);
        } else {
            setEditTests([]);
            setEditTestId("");
        }
    }, [editSubjectId]);

    useEffect(() => {
        void fetchMcqs();
    }, [selectedClassId, selectedSubjectId, selectedTestId, debouncedSearch, page]);

    const loadClasses = async () => {
        try {
            const res = await fetch("/api/classes");
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(data.data || []);
            }
        } catch (e) {
            console.error("Failed to load classes:", e);
        }
    };

    const loadSubjects = async (classId: string, isForEditModal: boolean) => {
        try {
            const res = await fetch(`/api/subjects?classId=${classId}`);
            const data = await res.json();
            if (res.ok && data.success) {
                if (isForEditModal) {
                    setEditSubjects(data.data || []);
                } else {
                    setSubjects(data.data || []);
                    setSelectedSubjectId("");
                    setTests([]);
                    setSelectedTestId("");
                }
            }
        } catch (e) {
            console.error("Failed to load subjects:", e);
        }
    };

    const loadTests = async (classId: string, subjectId: string, isForEditModal: boolean) => {
        try {
            const res = await fetch(`/api/admin/tests?classId=${classId}&subjectId=${subjectId}`);
            const data = await res.json();
            if (res.ok && data.success) {
                if (isForEditModal) {
                    setEditTests(data.data || []);
                } else {
                    setTests(data.data || []);
                    setSelectedTestId("");
                }
            }
        } catch (e) {
            console.error("Failed to load tests:", e);
        }
    };

    const fetchMcqs = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = `?page=${page}&limit=${limit}`;
            if (selectedClassId) query += `&classId=${selectedClassId}`;
            if (selectedSubjectId) query += `&subjectId=${selectedSubjectId}`;
            if (selectedTestId) query += `&testId=${selectedTestId}`;
            if (debouncedSearch.trim()) query += `&search=${encodeURIComponent(debouncedSearch.trim())}`;

            const res = await fetch(`/api/mcqs${query}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setMcqs(data.data || []);
                setTotalPages(data.pagination?.pages || 1);
                setTotalCount(data.pagination?.total || 0);
            } else {
                setError(data.message || "Failed to load MCQs.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load MCQs.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this MCQ question?")) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);
            const res = await fetch(`/api/mcqs/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess("MCQ deleted successfully!");
                await fetchMcqs();
            } else {
                setError(data.message || "Failed to delete MCQ.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to delete MCQ.");
        }
    };

    const openEditModal = (mcq: MCQItem) => {
        setEditingMcq(mcq);
        setEditQuestion(mcq.question);
        setEditOptions([...mcq.options]);
        setEditCorrectAnswer(mcq.correctAnswer);
        setEditClassId(mcq.classId?._id || "");
        
        setTimeout(() => {
            setEditSubjectId(mcq.subjectId?._id || "");
            setTimeout(() => {
                setEditTestId(mcq.testId?._id || "");
            }, 300);
        }, 300);

        setError(null);
        setSuccess(null);
    };

    const handleEditOptionChange = (index: number, val: string) => {
        const next = [...editOptions];
        next[index] = val;
        setEditOptions(next);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMcq) return;

        setError(null);
        setSuccess(null);

        if (!editQuestion.trim()) return setError("Question text is required.");
        if (editOptions.some((o) => !o.trim())) return setError("All options must be filled.");
        if (!editClassId) return setError("Class selection is required.");
        if (!editSubjectId) return setError("Subject selection is required.");
        if (!editTestId) return setError("Test selection is required.");

        setSavingEdit(true);
        try {
            const res = await fetch(`/api/mcqs/${editingMcq._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: editQuestion.trim(),
                    options: editOptions.map((o) => o.trim()),
                    correctAnswer: editCorrectAnswer,
                    classId: editClassId,
                    subjectId: editSubjectId,
                    testId: editTestId,
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess("MCQ updated successfully!");
                setEditingMcq(null);
                await fetchMcqs();
            } else {
                setError(data.message || "Failed to update MCQ.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to save changes.");
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <AdminShell title="Manage Exam Questions" subtitle="View, search, edit, and delete multiple-choice questions used in practice tests">
            {/* Stats Bar */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-4 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total Questions</p>
                            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Active in Bank</p>
                        <p className="text-sm font-semibold text-emerald-600">✓ Ready for tests</p>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {(error || success) && (
                <div className="mb-6">
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
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Search Question
                        </label>
                        <input
                            type="text"
                            placeholder="Search by keyword..."
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Filter by Class
                        </label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                        >
                            <option value="">All Classes</option>
                            {classes.map((c) => (
                                <option key={c._id} value={c._id}>
                                    Grade {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Filter by Subject
                        </label>
                        <select
                            value={selectedSubjectId}
                            disabled={!selectedClassId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Filter by Test
                        </label>
                        <select
                            value={selectedTestId}
                            disabled={!selectedSubjectId}
                            onChange={(e) => setSelectedTestId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">All Tests</option>
                            {tests.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* MCQs Table */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
                        <p className="text-sm text-slate-500 mt-4">Loading questions...</p>
                    </div>
                ) : mcqs.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400">No MCQ questions found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or add new questions</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="text-left py-4 pl-6 pr-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Question
                                        </th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Class
                                        </th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Test
                                        </th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Answer
                                        </th>
                                        <th className="text-right py-4 pr-6 pl-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mcqs.map((mcq) => (
                                        <tr key={mcq._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-4 pl-6 pr-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm text-slate-700 line-clamp-2" title={mcq.question}>
                                                        {renderFormattedText(mcq.question)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    Grade {mcq.classId?.name || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 text-xs font-medium text-violet-600">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    {mcq.subjectId?.name || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-xs font-medium text-amber-600">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    {mcq.testId?.name || "General"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Option {String.fromCharCode(65 + mcq.correctAnswer)}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-6 pl-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(mcq)}
                                                        className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(mcq._id)}
                                                        className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50/30">
                                <span className="text-xs text-slate-500">
                                    Page <strong className="text-slate-700">{page}</strong> of <strong className="text-slate-700">{totalPages}</strong>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {editingMcq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-50">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Edit MCQ Question</h3>
                            </div>
                            <button
                                onClick={() => setEditingMcq(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Class
                                    </label>
                                    <select
                                        value={editClassId}
                                        onChange={(e) => setEditClassId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                Grade {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Subject
                                    </label>
                                    <select
                                        value={editSubjectId}
                                        disabled={!editClassId}
                                        onChange={(e) => setEditSubjectId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                                    >
                                        <option value="">Select Subject</option>
                                        {editSubjects.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Test
                                    </label>
                                    <select
                                        value={editTestId}
                                        disabled={!editSubjectId}
                                        onChange={(e) => setEditTestId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                                    >
                                        <option value="">Select Test</option>
                                        {editTests.map((t) => (
                                            <option key={t._id} value={t._id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Question Text
                                </label>
                                <textarea
                                    rows={3}
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Enter the question..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {editOptions.map((o, idx) => (
                                    <div key={idx}>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                                            <span>Option {String.fromCharCode(65 + idx)}</span>
                                            {editCorrectAnswer === idx && (
                                                <span className="text-emerald-600">✓ Correct</span>
                                            )}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={o}
                                                onChange={(e) => handleEditOptionChange(idx, e.target.value)}
                                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEditCorrectAnswer(idx)}
                                                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${editCorrectAnswer === idx
                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                                        : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                                    }`}
                                            >
                                                {editCorrectAnswer === idx ? "✓" : "○"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingMcq(null)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50"
                                >
                                    {savingEdit ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}