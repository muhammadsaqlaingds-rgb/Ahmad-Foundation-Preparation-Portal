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
};

type TestItem = {
    _id: string;
    name: string;
};

export default function AddMcqsPage() {
    const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [tests, setTests] = useState<TestItem[]>([]);
    
    const [loadingData, setLoadingData] = useState(true);
    const [loadingTests, setLoadingTests] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedTestId, setSelectedTestId] = useState("");
    
    const [quickTestName, setQuickTestName] = useState("");
    const [addingQuickTest, setAddingQuickTest] = useState(false);

    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [correctAnswer, setCorrectAnswer] = useState<number>(0);

    const [bulkJson, setBulkJson] = useState("");
    const [bulkValidationMessage, setBulkValidationMessage] = useState<string | null>(null);

    useEffect(() => {
        void fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            void fetchSubjects(selectedClassId);
        } else {
            setSubjects([]);
            setSelectedSubjectId("");
            setTests([]);
            setSelectedTestId("");
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedClassId && selectedSubjectId) {
            void fetchTests(selectedClassId, selectedSubjectId);
        } else {
            setTests([]);
            setSelectedTestId("");
        }
    }, [selectedClassId, selectedSubjectId]);

    const fetchClasses = async () => {
        try {
            setLoadingData(true);
            const res = await fetch("/api/classes");
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(data.data || []);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch classes.");
        } finally {
            setLoadingData(false);
        }
    };

    const fetchSubjects = async (classId: string) => {
        try {
            const res = await fetch(`/api/subjects?classId=${classId}`);
            const data = await res.json();
            if (res.ok && data.success) {
                setSubjects(data.data || []);
                setSelectedSubjectId("");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch subjects.");
        }
    };

    const fetchTests = async (classId: string, subjectId: string, autoSelectId?: string) => {
        try {
            setLoadingTests(true);
            const res = await fetch(`/api/admin/tests?classId=${classId}&subjectId=${subjectId}`);
            const data = await res.json();
            if (res.ok && data.success) {
                const list = data.data || [];
                setTests(list);
                if (autoSelectId) {
                    setSelectedTestId(autoSelectId);
                } else if (list.length > 0 && !selectedTestId) {
                    const stillExists = list.some((t: any) => t._id === selectedTestId);
                    if (!stillExists) {
                        setSelectedTestId(list[0]._id);
                    }
                } else if (list.length === 0) {
                    setSelectedTestId("");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTests(false);
        }
    };

    const handleQuickAddTest = async () => {
        if (!quickTestName.trim()) return;
        if (!selectedClassId || !selectedSubjectId) {
            setError("Please select Class and Subject first.");
            return;
        }

        setAddingQuickTest(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/admin/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: quickTestName.trim(),
                    classId: selectedClassId,
                    subjectId: selectedSubjectId,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(`Test "${data.data.name}" added successfully!`);
                setQuickTestName("");
                await fetchTests(selectedClassId, selectedSubjectId, data.data._id);
            } else {
                setError(data.message || "Failed to create quick test.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to quick add test.");
        } finally {
            setAddingQuickTest(false);
        }
    };

    const handleOptionChange = (index: number, val: string) => {
        const nextOptions = [...options];
        nextOptions[index] = val;
        setOptions(nextOptions);
    };

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedClassId) return setError("Please select a class.");
        if (!selectedSubjectId) return setError("Please select a subject.");
        if (!selectedTestId) return setError("Please select or create a test.");
        if (!question.trim()) return setError("Question text is required.");
        if (options.some((opt) => !opt.trim())) {
            return setError("All 4 options must be filled.");
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/mcqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question.trim(),
                    options: options.map((o) => o.trim()),
                    correctAnswer,
                    classId: selectedClassId,
                    subjectId: selectedSubjectId,
                    testId: selectedTestId,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to add MCQ.");
            } else {
                setSuccess("MCQ added successfully!");
                setQuestion("");
                setOptions(["", "", "", ""]);
                setCorrectAnswer(0);
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const generateBulkTemplate = () => {
        if (!selectedClassId || !selectedSubjectId || !selectedTestId) {
            alert("Please select Class, Subject, and Test first to generate a customized template.");
            return;
        }

        const template = [
            {
                question: "Sample Question 1: What is the unit of force?",
                options: ["Newton", "Joule", "Pascal", "Watt"],
                correctAnswer: 0,
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                testId: selectedTestId
            },
            {
                question: "Sample Question 2: Which element has the chemical symbol O?",
                options: ["Gold", "Oxygen", "Iron", "Carbon"],
                correctAnswer: 1,
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                testId: selectedTestId
            }
        ];

        setBulkJson(JSON.stringify(template, null, 4));
        setBulkValidationMessage("✓ Template generated! You can edit this JSON or paste your own.");
    };

    const validateBulkJson = (jsonStr: string) => {
        if (!jsonStr.trim()) {
            setBulkValidationMessage(null);
            return null;
        }

        try {
            const parsed = JSON.parse(jsonStr);
            if (!Array.isArray(parsed)) {
                setBulkValidationMessage("✗ JSON must be a root Array of MCQ objects.");
                return null;
            }

            for (let i = 0; i < parsed.length; i++) {
                const item = parsed[i];
                if (!item.question || typeof item.question !== "string" || !item.question.trim()) {
                    setBulkValidationMessage(`✗ Item #${i + 1}: question must be a non-empty string.`);
                    return null;
                }
                if (!item.options || !Array.isArray(item.options) || item.options.length !== 4) {
                    setBulkValidationMessage(`✗ Item #${i + 1}: options must be an array of exactly 4 strings.`);
                    return null;
                }
                if (item.options.some((o: any) => typeof o !== "string" || !o.trim())) {
                    setBulkValidationMessage(`✗ Item #${i + 1}: all 4 options must be non-empty strings.`);
                    return null;
                }
                if (item.correctAnswer === undefined || typeof item.correctAnswer !== "number" || item.correctAnswer < 0 || item.correctAnswer > 3) {
                    setBulkValidationMessage(`✗ Item #${i + 1}: correctAnswer must be index 0, 1, 2, or 3.`);
                    return null;
                }
                if (!item.classId || typeof item.classId !== "string") {
                    setBulkValidationMessage(`✗ Item #${i + 1}: classId must be a valid ID string.`);
                    return null;
                }
                if (!item.subjectId || typeof item.subjectId !== "string") {
                    setBulkValidationMessage(`✗ Item #${i + 1}: subjectId must be a valid ID string.`);
                    return null;
                }
                if (!item.testId || typeof item.testId !== "string") {
                    setBulkValidationMessage(`✗ Item #${i + 1}: testId must be a valid ID string.`);
                    return null;
                }
            }

            setBulkValidationMessage(`✓ Valid JSON! Ready to upload ${parsed.length} question(s).`);
            return parsed;
        } catch (e) {
            setBulkValidationMessage("✗ Invalid JSON syntax. Please check your formatting.");
            return null;
        }
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const parsed = validateBulkJson(bulkJson);
        if (!parsed) {
            setError("JSON validation failed. Please fix structural errors before uploading.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/mcqs/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mcqs: parsed }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to upload bulk MCQs.");
            } else {
                setSuccess(data.message || `Successfully uploaded ${parsed.length} MCQs!`);
                setBulkJson("");
                setBulkValidationMessage(null);
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong during bulk upload. Please check your data.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminShell title="Add MCQs" subtitle="Create single questions or upload bulk question templates">
            {/* Configuration Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Target Configuration
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Select where these questions belong</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Class Level
                                </label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    disabled={loadingData}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all disabled:opacity-50"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((cls) => (
                                        <option key={cls._id} value={cls._id}>
                                            Grade {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Subject Category
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    disabled={!selectedClassId}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {selectedClassId ? "Select Subject" : "Select class first"}
                                    </option>
                                    {subjects.map((subj) => (
                                        <option key={subj._id} value={subj._id}>
                                            {subj.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Test Category
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedTestId}
                                        onChange={(e) => setSelectedTestId(e.target.value)}
                                        disabled={!selectedSubjectId || loadingTests}
                                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all disabled:opacity-50"
                                    >
                                        <option value="">
                                            {loadingTests ? "Loading..." : selectedSubjectId ? "Select Test" : "Select subject first"}
                                        </option>
                                        {tests.map((test) => (
                                            <option key={test._id} value={test._id}>
                                                {test.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {selectedClassId && selectedSubjectId && (
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs text-slate-500">Can't find your test?</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter test name"
                                            value={quickTestName}
                                            onChange={(e) => setQuickTestName(e.target.value)}
                                            disabled={addingQuickTest}
                                            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleQuickAddTest}
                                            disabled={addingQuickTest || !quickTestName.trim()}
                                            className="px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 text-sm font-medium transition-all disabled:opacity-50"
                                        >
                                            {addingQuickTest ? "Creating..." : "+ Quick Create"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error/Success Messages */}
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

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab("single")}
                    className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                        activeTab === "single"
                            ? "bg-white text-indigo-600 border-t border-l border-r border-slate-200 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Single MCQ Form
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("bulk")}
                    className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                        activeTab === "bulk"
                            ? "bg-white text-indigo-600 border-t border-l border-r border-slate-200 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Bulk JSON Upload
                    </span>
                </button>
            </div>

            {/* Single MCQ Form */}
            {activeTab === "single" && (
                <form onSubmit={handleSingleSubmit}>
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Question Text
                                </label>
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                                    placeholder="Enter the question text here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {options.map((opt, index) => (
                                    <div key={index} className="space-y-2">
                                        <label className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            <span>Option {String.fromCharCode(65 + index)}</span>
                                            {correctAnswer === index && (
                                                <span className="text-emerald-600 text-[10px]">✓ Correct Answer</span>
                                            )}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCorrectAnswer(index)}
                                                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                    correctAnswer === index
                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                                        : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                                }`}
                                            >
                                                {correctAnswer === index ? "✓" : "○"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Set Correct Answer
                                </label>
                                <select
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(parseInt(e.target.value, 10))}
                                    className="w-full md:w-64 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                >
                                    <option value={0}>Option A (Index 0)</option>
                                    <option value={1}>Option B (Index 1)</option>
                                    <option value={2}>Option C (Index 2)</option>
                                    <option value={3}>Option D (Index 3)</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    "Add MCQ Question"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Bulk Upload Form */}
            {activeTab === "bulk" && (
                <form onSubmit={handleBulkSubmit}>
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        Bulk Upload Paste Board
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Paste a valid JSON array of MCQ items. Include all required properties.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={generateBulkTemplate}
                                    className="px-4 py-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 text-sm font-medium transition-all"
                                >
                                    Generate Sample Template
                                </button>
                            </div>

                            <div>
                                <textarea
                                    value={bulkJson}
                                    onChange={(e) => {
                                        setBulkJson(e.target.value);
                                        validateBulkJson(e.target.value);
                                    }}
                                    rows={12}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                    placeholder={`[\n  {\n    "question": "What is the capital of France?",\n    "options": ["London", "Berlin", "Paris", "Madrid"],\n    "correctAnswer": 2,\n    "classId": "${selectedClassId || 'CLASS_ID'}",\n    "subjectId": "${selectedSubjectId || 'SUBJECT_ID'}",\n    "testId": "${selectedTestId || 'TEST_ID'}"\n  }\n]`}
                                />
                            </div>

                            {bulkValidationMessage && (
                                <div className={`flex items-start gap-2 p-3 rounded-xl border ${
                                    bulkValidationMessage.startsWith("✓")
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                }`}>
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={bulkValidationMessage.startsWith("✓") ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                    </svg>
                                    <span className="text-sm">{bulkValidationMessage}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting || !bulkJson.trim() || (bulkValidationMessage && !bulkValidationMessage.startsWith("✓"))}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload Bulk MCQ Package"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </AdminShell>
    );
}