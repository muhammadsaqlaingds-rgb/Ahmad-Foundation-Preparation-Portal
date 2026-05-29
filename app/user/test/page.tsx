"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CouponRedeem from "@/components/CouponRedeem";
import {
    UserPortalBackground,
    TestPaperIllustration,
    StepsGuide,
} from "@/components/user/UserPortalUI";

type ClassItem = {
    _id: string;
    name: string;
    status: "locked" | "pending" | "approved" | "rejected";
};

type Subject = {
    _id: string;
    name: string;
};

type TestItem = {
    _id: string;
    name: string;
    isCompleted: boolean;
    isUnlocked: boolean;
};

type MCQ = {
    _id: string;
    question: string;
    options: string[];
};

const WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "";

function UserTestPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const retryClassId = searchParams.get("classId") || "";
    const retrySubjectId = searchParams.get("subjectId") || "";
    const retryTestId = searchParams.get("testId") || "";

    const [loadingUser, setLoadingUser] = useState(true);

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [tests, setTests] = useState<TestItem[]>([]);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTest, setSelectedTest] = useState("");
    const [examMode, setExamMode] = useState<"standard" | "full">("standard");

    const [paymentMethod, setPaymentMethod] = useState<"easypaisa" | "jazzcash" | "whatsapp">("easypaisa");
    const [paymentDetails, setPaymentDetails] = useState("");
    const [submittingAccess, setSubmittingAccess] = useState(false);

    const [testStarted, setTestStarted] = useState(false);
    const retryAutoStartedRef = useRef(false);
    const [questions, setQuestions] = useState<MCQ[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [loadingTests, setLoadingTests] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [answers, setAnswers] = useState<Record<string, number>>({});
    const allMcqIds = useRef<Set<string>>(new Set());
    const startTimeRef = useRef<string>("");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasPreloadedRetryRef = useRef(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [couponRedeemed, setCouponRedeemed] = useState(false);

    const limit = examMode === "standard" ? 10 : 50;

    const loadClasses = async () => {
        try {
            const res = await fetch("/api/user/classes");
            if (res.ok) {
                const data = await res.json();
                setClasses(data.classes || []);
            }
        } catch (err) {
            console.error("Classes load error:", err);
        }
    };

    const handleCouponSuccess = async () => {
        setCouponRedeemed(true);
        setSuccessMsg("Coupon redeemed successfully!");
        setError(null);
        await loadClasses();
    };

    const isRetryFlow = !!(retryClassId && retrySubjectId && retryTestId);

    useEffect(() => {
        const verifySessionAndPreload = async () => {
            try {
                // Initialize parallel fetch promises for session verification and class loading
                const promises: Promise<Response>[] = [
                    fetch("/api/auth/me"),
                    fetch("/api/user/classes")
                ];

                // If in retry flow, pre-fetch subjects and tests in parallel on mount to avoid waterfalls
                if (isRetryFlow) {
                    promises.push(fetch(`/api/user/subjects?classId=${retryClassId}`));
                    promises.push(fetch(`/api/user/tests?subjectId=${retrySubjectId}`));
                }

                const results = await Promise.all(promises);
                const meRes = results[0];
                const classesRes = results[1];

                if (!meRes.ok) {
                    router.push("/login");
                    return;
                }

                if (classesRes.ok) {
                    const data = await classesRes.json();
                    setClasses(data.classes || []);
                }

                if (isRetryFlow && results[2]?.ok) {
                    const data = await results[2].json();
                    setSubjects(data.subjects || []);
                }

                if (isRetryFlow && results[3]?.ok) {
                    const data = await results[3].json();
                    setTests(data.tests || []);
                }

                if (isRetryFlow) {
                    hasPreloadedRetryRef.current = true;
                }
            } catch (err) {
                console.error("Session verification and preload error:", err);
            } finally {
                setLoadingUser(false);
            }
        };
        verifySessionAndPreload();
    }, [router, isRetryFlow, retryClassId, retrySubjectId]);

    // Auto-select class/subject/test when arriving via retry link
    useEffect(() => {
        if (!retryClassId || loadingUser) return;
        setSelectedClass(retryClassId);
    }, [retryClassId, loadingUser]);

    useEffect(() => {
        if (!retrySubjectId || !subjects.length) return;
        const sub = subjects.find((s) => s._id === retrySubjectId);
        if (sub) setSelectedSubject(retrySubjectId);
    }, [retrySubjectId, subjects]);

    useEffect(() => {
        if (!retryTestId || !tests.length) return;
        const t = tests.find((t) => t._id === retryTestId);
        if (t && t.isUnlocked !== false) setSelectedTest(retryTestId);
    }, [retryTestId, tests]);

    // Auto-START: once all 3 retry selections are applied, jump straight into the MCQs
    useEffect(() => {
        if (!retryClassId || !retrySubjectId || !retryTestId) return;
        if (testStarted || retryAutoStartedRef.current) return;
        if (
            selectedClass === retryClassId &&
            selectedSubject === retrySubjectId &&
            selectedTest === retryTestId &&
            subjects.length > 0 &&
            tests.length > 0
        ) {
            retryAutoStartedRef.current = true;
            handleStartTest();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedSubject, selectedTest, subjects, tests]);

    const activeClass = classes.find((c) => c._id === selectedClass);
    const activeClassStatus = activeClass?.status || "locked";

    // Fetch subjects when class changes
    useEffect(() => {
        if (!selectedClass || activeClassStatus !== "approved") {
            setSubjects([]); if (!isRetryFlow) { setSelectedSubject(""); } setTests([]); if (!isRetryFlow) { setSelectedTest(""); } return;
        }
        const fetchSubjects = async () => {
            // Guard: If subjects are already pre-loaded during parallel init retry flow, skip fetching
            if (isRetryFlow && selectedClass === retryClassId && hasPreloadedRetryRef.current) {
                return;
            }
            try {
                setLoadingSubjects(true);
                const res = await fetch(`/api/user/subjects?classId=${selectedClass}`);
                if (res.ok) {
                    const data = await res.json();
                    setSubjects(data.subjects || []);
                    if (!isRetryFlow) { setSelectedSubject(""); setTests([]); setSelectedTest(""); }
                }
            } catch (err) { console.error("Error loading subjects:", err); }
            finally { setLoadingSubjects(false); }
        };
        fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, activeClassStatus]);

    // Fetch tests when subject changes
    useEffect(() => {
        if (!selectedClass || !selectedSubject || activeClassStatus !== "approved") {
            setTests([]); if (!isRetryFlow) { setSelectedTest(""); } return;
        }
        const fetchTestsList = async () => {
            // Guard: If tests are already pre-loaded during parallel init retry flow, skip fetching
            if (isRetryFlow && selectedSubject === retrySubjectId && hasPreloadedRetryRef.current) {
                return;
            }
            try {
                setLoadingTests(true);
                const res = await fetch(`/api/user/tests?subjectId=${selectedSubject}`);
                if (res.ok) {
                    const data = await res.json();
                    setTests(data.tests || []);
                    if (!isRetryFlow) { setSelectedTest(""); }
                } else {
                    const data = await res.json();
                    setError(data.error || "Failed to load tests.");
                }
            } catch (err) { console.error("Error loading tests:", err); }
            finally { setLoadingTests(false); }
        };
        fetchTestsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedSubject, activeClassStatus]);

    // Exam timer
    useEffect(() => {
        if (testStarted) {
            setElapsedSeconds(0);
            timerRef.current = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [testStarted]);

    const submitAccessRequest = async (method: "easypaisa" | "jazzcash" | "whatsapp", details: string) => {
        if (!selectedClass) return;
        setSubmittingAccess(true); setError(null); setSuccessMsg(null);
        try {
            const res = await fetch("/api/user/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId: selectedClass, paymentMethod: method, paymentDetails: details }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessMsg(data.message || "Request received. We will unlock your class after confirmation.");
                await loadClasses();
            } else {
                setError(data.error || "Failed to submit request.");
            }
        } catch { setError("Network error. Please try again."); }
        finally { setSubmittingAccess(false); }
    };

    const handleWhatsAppAccessRequest = async () => {
        await submitAccessRequest("whatsapp", "Contacted via WhatsApp for premium access");
    };

    const fetchQuestionsBatch = async (page: number) => {
        setLoadingQuestions(true); setError(null);
        try {
            const res = await fetch(
                `/api/user/mcqs?classId=${selectedClass}&subjectId=${selectedSubject}&testId=${selectedTest}&page=${page}&limit=${limit}`
            );
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to load questions."); }
            const data = await res.json();
            const batch: MCQ[] = data.mcqs || [];
            setQuestions(batch); setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 1); setCurrentPage(data.currentPage || 1);
            batch.forEach((mcq) => allMcqIds.current.add(mcq._id));
        } catch (err: any) { setError(err.message); }
        finally { setLoadingQuestions(false); }
    };

    const handleStartTest = async () => {
        if (!selectedClass || !selectedSubject || !selectedTest) return;
        setError(null); setAnswers({}); allMcqIds.current.clear();
        startTimeRef.current = new Date().toISOString();
        setTestStarted(true);
        await fetchQuestionsBatch(1);
    };

    const handleSelectOption = (mcqId: string, optionIndex: number) => {
        setAnswers((prev) => ({ ...prev, [mcqId]: optionIndex }));
    };

    const handleSubmitTest = async () => {
        const answeredKeys = Object.keys(answers);
        if (answeredKeys.length < questions.length) {
            setError("Please attempt all questions on this page before submitting.");
            setShowConfirm(false); return;
        }
        setSubmitting(true); setError(null);
        const answersPayload = Array.from(allMcqIds.current).map((id) => ({
            mcqId: id,
            selectedOption: answers[id] !== undefined ? answers[id] : null,
        }));
        try {
            const res = await fetch("/api/tests/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: selectedClass, subjectId: selectedSubject,
                    testId: selectedTest, startTime: startTimeRef.current, answers: answersPayload,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submission failed.");
            router.push(`/user/result/${data.testId}`);
        } catch (err: any) {
            setError(err.message); setSubmitting(false); setShowConfirm(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const handlePreventCopy = (e: React.ClipboardEvent) => { if (testStarted) e.preventDefault(); };
    const handlePreventKeyDown = (e: React.KeyboardEvent) => {
        if (testStarted) {
            if (e.ctrlKey && ["c", "v", "u"].includes(e.key.toLowerCase())) e.preventDefault();
            if (e.key === "F12") e.preventDefault();
        }
    };

    const activeClassName = activeClass?.name || "";
    const activeSubjectName = subjects.find((s) => s._id === selectedSubject)?.name || "";
    const activeTestName = tests.find((t) => t._id === selectedTest)?.name || "";
    const selectedTestObj = tests.find((t) => t._id === selectedTest);
    const isTestSelectedLocked = selectedTestObj?.isUnlocked === false;
    const allTestsCompleted = tests.length > 0 && tests.every((t) => t.isCompleted);
    const availableTests = tests.filter((t) => t.isUnlocked);

    const setupSteps = [
        { num: 1, title: "Select class", desc: "Pick your unlocked grade", active: !selectedClass, done: !!selectedClass },
        { num: 2, title: "Choose subject", desc: "Math, Science, English…", active: !!selectedClass && !selectedSubject, done: !!selectedSubject },
        { num: 3, title: "Select test", desc: "Pick an available test", active: !!selectedSubject && !selectedTest, done: !!selectedTest },
        { num: 4, title: "Launch exam", desc: "Timed MCQ test paper", active: !!selectedTest && !testStarted, done: testStarted },
    ];

    if (loadingUser) {
        return (
            <UserPortalBackground>
                <div className="min-h-screen flex flex-col justify-center items-center gap-4 relative z-10">
                    <svg className="animate-spin h-10 w-10 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-400 text-sm animate-pulse">Opening practice room...</p>
                </div>
            </UserPortalBackground>
        );
    }

    return (
        <UserPortalBackground>
            <div
                className="relative"
                onContextMenu={(e) => testStarted && e.preventDefault()}
                onCopy={handlePreventCopy}
                onKeyDown={handlePreventKeyDown}
            >
            {/* ── Header ── */}
            <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/user/dashboard" className="text-slate-400 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </Link>
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4af37]">Practice Room</p>
                        <p className="text-sm font-black text-white">Mock Test Papers</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold hidden sm:block">Ahmad Foundation</span>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 relative z-10 pb-8">

            {!testStarted ? (
                <div className="animate-fadeIn">
                    {/* Page heading */}
                    <div className="mb-8">
                        <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-2 text-center lg:text-left">
                            Tuition · Online MCQ Tests
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-black text-center lg:text-left bg-gradient-to-r from-white via-slate-100 to-[#d4af37] bg-clip-text text-transparent">
                            Set Up Your Test Paper
                        </h1>
                        <p className="text-slate-400 text-sm mt-2 text-center lg:text-left max-w-xl">
                            Select your class, subject, and test — then launch your timed practice exam.
                        </p>
                    </div>

                    <div className="mb-8 hidden lg:block">
                        <StepsGuide steps={setupSteps} />
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8 items-start">
                    {/* ── Left: Config Panel ── */}
                    <div className="lg:col-span-3 bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                            <div className="h-11 w-11 rounded-xl bg-[#0f4c81]/30 border border-[#0f4c81]/40 flex items-center justify-center">
                                <svg className="h-5 w-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Exam Configuration</h2>
                                <p className="text-slate-500 text-xs">Select options in order</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs font-semibold mb-6 flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-xs font-semibold mb-6 flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-6">

                            {/* ── STEP 1: Class (only unlocked) ── */}
                            <div>
                                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                                    Step 1 — Select Your Class
                                </label>

                                <select
                                    value={selectedClass}
                                    onChange={(e) => { 
                                        setSelectedClass(e.target.value); 
                                        setError(null); 
                                        setSuccessMsg(null); 
                                    }}
                                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f4c81] focus:ring-2 focus:ring-[#0f4c81]/30"
                                >
                                    <option value="">— Choose your class —</option>
                                    {classes.map((cls) => (
                                        <option key={cls._id} value={cls._id}>
                                            Class {cls.name} {cls.status === "approved" ? "· Unlocked" : cls.status === "pending" ? "· Pending Approval" : "· Locked"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ── Locked Class Payment Options ── */}
                            {selectedClass && activeClassStatus !== "approved" && (
                                <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 mt-4 space-y-6 animate-fadeIn">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-black text-white mb-1">
                                                Class {activeClassName} is Locked
                                            </h3>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                {activeClassStatus === "pending"
                                                    ? "Your access request is currently pending verification. We will unlock it shortly."
                                                    : "Access to this class requires verification. You can request access by entering payment details or redeeming a coupon."}
                                            </p>
                                        </div>
                                    </div>

                                    {activeClassStatus !== "pending" && (
                                        <div className="space-y-6 border-t border-white/5 pt-6">
                                            {/* Coupon Redemption */}
                                            <div>
                                                <CouponRedeem classId={selectedClass} onSuccess={handleCouponSuccess} />
                                            </div>

                                            <div className="relative flex py-2 items-center">
                                                <div className="flex-grow border-t border-white/5"></div>
                                                <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Or Pay / Request Access</span>
                                                <div className="flex-grow border-t border-white/5"></div>
                                            </div>

                                            {/* Payment Details Form */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                                                        Payment Method
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(["easypaisa", "jazzcash", "whatsapp"] as const).map((method) => (
                                                            <button
                                                                key={method}
                                                                type="button"
                                                                onClick={() => setPaymentMethod(method)}
                                                                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                                                                    paymentMethod === method
                                                                        ? "bg-[#0f4c81]/40 border-[#0f4c81] text-white"
                                                                        : "bg-slate-900 border-white/5 text-slate-400 hover:border-white/10"
                                                                }`}
                                                            >
                                                                {method === "easypaisa" ? "EasyPaisa" : method === "jazzcash" ? "JazzCash" : "WhatsApp"}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {paymentMethod !== "whatsapp" ? (
                                                    <div className="space-y-4 animate-fadeIn">
                                                        <div className="bg-slate-900 border border-white/5 rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
                                                            <p className="font-bold text-[#d4af37] mb-1">Payment Instructions:</p>
                                                            <p>Send the premium access fee to one of our official accounts:</p>
                                                            <p className="mt-1 font-semibold text-slate-300">
                                                                {paymentMethod === "easypaisa" ? "EasyPaisa Account: 0300-1234567 (Ahmad Tuition)" : "JazzCash Account: 0300-1234567 (Ahmad Tuition)"}
                                                            </p>
                                                            <p className="mt-1">Enter your transaction ID, transaction screenshot details, or sending account name below and submit.</p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                                                Transaction ID / Reference Details
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={paymentDetails}
                                                                onChange={(e) => setPaymentDetails(e.target.value)}
                                                                placeholder="e.g. Txn ID: 817263541 or Account Name"
                                                                className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#0f4c81]"
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={submittingAccess || !paymentDetails.trim()}
                                                            onClick={() => submitAccessRequest(paymentMethod, paymentDetails)}
                                                            className="w-full py-2.5 bg-[#0f4c81] hover:bg-[#1e6f9f] text-white font-bold text-xs rounded-xl transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            {submittingAccess ? "Submitting..." : "Submit Access Request"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 animate-fadeIn">
                                                        <p className="text-slate-400 text-xs leading-relaxed">
                                                            Click the button below to contact our support team on WhatsApp to request manual activation.
                                                        </p>
                                                        {WHATSAPP_GROUP_URL && (
                                                            <a
                                                                href={WHATSAPP_GROUP_URL}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={handleWhatsAppAccessRequest}
                                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-3 transition-colors"
                                                            >
                                                                Contact Support on WhatsApp
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── STEP 2: Subject (only if class selected & approved) ── */}
                            {selectedClass && activeClassStatus === "approved" && (
                                <div className="animate-fadeIn">
                                    <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                                        Step 2 — Select Subject
                                    </label>
                                    {loadingSubjects ? (
                                        <div className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading subjects...
                                        </div>
                                    ) : subjects.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
                                            <p className="text-slate-400 text-xs">No subjects available for this class yet.</p>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => { setSelectedSubject(e.target.value); setError(null); }}
                                            className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f4c81] focus:ring-2 focus:ring-[#0f4c81]/30"
                                        >
                                            <option value="">— Select a subject —</option>
                                            {subjects.map((sub) => (
                                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* ── STEP 3: Test (only if subject selected) ── */}
                            {selectedClass && selectedSubject && activeClassStatus === "approved" && (
                                <div className="animate-fadeIn">
                                    <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                                        Step 3 — Select Test
                                    </label>

                                    {loadingTests ? (
                                        <div className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading tests...
                                        </div>
                                    ) : tests.length === 0 ? (
                                        /* No tests exist for this subject at all */
                                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-white/5">
                                                <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-bold text-white mb-1">No Tests Available</p>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                No tests have been added for <span className="text-[#d4af37] font-semibold">{subjects.find(s => s._id === selectedSubject)?.name}</span> yet.
                                                Check back later or contact your teacher.
                                            </p>
                                        </div>
                                    ) : allTestsCompleted ? (
                                        /* All tests done */
                                        <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-5 text-center">
                                            <p className="text-sm font-black text-[#d4af37] mb-1">🎉 All Tests Completed!</p>
                                            <p className="text-slate-400 text-xs">You&apos;ve finished every test in this subject. New tests will be added soon.</p>
                                        </div>
                                    ) : (
                                        /* Tests available — show as cards */
                                        <div className="space-y-2">
                                            {tests.map((test) => {
                                                const isSelected = selectedTest === test._id;
                                                const isLocked = !test.isUnlocked;
                                                return (
                                                    <button
                                                        key={test._id}
                                                        type="button"
                                                        disabled={isLocked}
                                                        onClick={() => { if (!isLocked) { setSelectedTest(test._id); setError(null); } }}
                                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                                                            isLocked
                                                                ? "border-white/5 bg-slate-950/50 opacity-50 cursor-not-allowed"
                                                                : isSelected
                                                                    ? "border-[#0f4c81] bg-[#0f4c81]/20 shadow-md shadow-[#0f4c81]/10"
                                                                    : "border-white/10 bg-slate-950 hover:border-white/20 hover:bg-slate-900 cursor-pointer"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                                                isLocked ? "bg-slate-800 text-slate-600" :
                                                                isSelected ? "bg-[#0f4c81] text-white" :
                                                                test.isCompleted ? "bg-emerald-500/20 text-emerald-400" :
                                                                "bg-[#d4af37]/15 text-[#d4af37]"
                                                            }`}>
                                                                {isLocked ? "🔒" : test.isCompleted ? "✓" : "▶"}
                                                            </span>
                                                            <div>
                                                                <p className={`text-sm font-bold ${isLocked ? "text-slate-600" : "text-white"}`}>{test.name}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                                    {isLocked ? "Complete previous test to unlock" : test.isCompleted ? "Completed · Retake available" : "Ready to attempt"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {!isLocked && (
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                                                test.isCompleted
                                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                    : "bg-[#d4af37]/10 border-[#d4af37]/20 text-[#d4af37]"
                                                            }`}>
                                                                {test.isCompleted ? "Done" : "Available"}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── STEP 4: Exam Mode + Launch (only if test selected) ── */}
                            {selectedTest && !isTestSelectedLocked && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">
                                            Step 4 — Select Exam Mode
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setExamMode("standard")}
                                                className={`p-4 rounded-xl border text-left transition-all ${
                                                    examMode === "standard"
                                                        ? "bg-[#0f4c81]/25 border-[#0f4c81] text-white"
                                                        : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="font-bold text-sm">Standard Practice</div>
                                                <div className="text-[10px] text-slate-400 mt-1">10 questions per page</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setExamMode("full")}
                                                className={`p-4 rounded-xl border text-left transition-all ${
                                                    examMode === "full"
                                                        ? "bg-[#d4af37]/10 border-[#d4af37] text-white"
                                                        : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="font-bold text-sm">Full Session</div>
                                                <div className="text-[10px] text-slate-400 mt-1">Up to 50 questions at once</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Selected summary */}
                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400 space-y-1.5">
                                        <div className="flex justify-between">
                                            <span>Class</span>
                                            <span className="text-white font-semibold">Class {activeClassName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Subject</span>
                                            <span className="text-white font-semibold">{activeSubjectName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Test</span>
                                            <span className="text-[#d4af37] font-semibold">{activeTestName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Mode</span>
                                            <span className="text-white font-semibold">{examMode === "standard" ? "Standard (10 Qs)" : "Full Session (50 Qs)"}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleStartTest}
                                        className="w-full relative overflow-hidden group py-4 text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg transition-all"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f]" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8960c] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            Launch Exam Room
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Illustration + Info ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="lg:sticky lg:top-24">
                            <TestPaperIllustration />
                        </div>
                        <div className="lg:hidden">
                            <StepsGuide steps={setupSteps} />
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
                            <h4 className="text-xs font-black text-[#d4af37] uppercase tracking-wider mb-3">What you get</h4>
                            <ul className="space-y-2.5 text-[11px] text-slate-400">
                                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Real MCQ test paper layout</li>
                                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Instant score after submit</li>
                                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Progress saved on dashboard</li>
                                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Anti-cheat protected exam</li>
                            </ul>
                        </div>
                        {/* Coupon / unlock hint */}
                        <div className="rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-5">
                            <h4 className="text-xs font-black text-[#d4af37] mb-2">Need to unlock a class?</h4>
                            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                                Contact your teacher on WhatsApp or enter a coupon code to get access to locked classes.
                            </p>
                            <Link href="/user/dashboard" className="text-[#d4af37] text-xs font-bold hover:underline">
                                Back to Dashboard →
                            </Link>
                        </div>
                    </div>
                    </div>
                </div>

            ) : (
                /* ── ACTIVE EXAM INTERFACE ── */
                <div className="space-y-6 animate-fadeIn">
                    {/* Sticky progress bar */}
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-6 sticky top-[68px] z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-xl">
                        <div>
                            <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">
                                Class {activeClassName} · {activeSubjectName} · {activeTestName}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1">
                                Progress: {answeredCount} / {questions.length} Answered
                            </h3>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#0f4c81] to-[#d4af37] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6 self-end sm:self-center">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Elapsed</div>
                                <div className="text-xl font-black text-white tabular-nums">
                                    {Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:
                                    {(elapsedSeconds % 60).toString().padStart(2, "0")}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(true)}
                                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg transition-all animate-pulse"
                            >
                                Submit Exam
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Questions */}
                    {loadingQuestions ? (
                        <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4 animate-pulse">
                                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                                    <div className="space-y-2 pl-4">
                                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                                        <div className="h-3 bg-slate-800 rounded w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {questions.length === 0 ? (
                                <div className="text-center bg-slate-900/80 border border-dashed border-white/10 rounded-2xl p-12 sm:p-16">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f4c81]/20 border border-[#0f4c81]/30">
                                        <svg className="h-8 w-8 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-black text-white mb-2">This test paper is empty</h4>
                                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                        No questions have been uploaded for this test yet. Try another test or contact Ahmad Foundation.
                                    </p>
                                </div>
                            ) : (
                                questions.map((mcq, idx) => {
                                    const serialNumber = (currentPage - 1) * limit + idx + 1;
                                    const selectedOption = answers[mcq._id];
                                    return (
                                        <div
                                            key={mcq._id}
                                            className={`bg-slate-900/60 border rounded-2xl p-6 sm:p-8 transition-all ${
                                                selectedOption !== undefined ? "border-[#0f4c81]/30 bg-[#0f4c81]/5" : "border-white/10"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3.5 mb-6">
                                                <span className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg bg-slate-850 border border-white/10 text-xs font-black text-[#d4af37]">
                                                    {serialNumber}
                                                </span>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed pt-0.5">
                                                    {mcq.question}
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-10">
                                                {mcq.options.map((option, optIdx) => {
                                                    const optionLetter = ["A", "B", "C", "D"][optIdx];
                                                    const isChecked = selectedOption === optIdx;
                                                    return (
                                                        <label
                                                            key={optIdx}
                                                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                                                isChecked
                                                                    ? "bg-[#0f4c81]/40 border-[#0f4c81] text-white shadow-md shadow-[#0f4c81]/10"
                                                                    : "bg-slate-950 border-white/5 text-slate-300 hover:border-white/10 hover:text-white"
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`mcq-${mcq._id}`}
                                                                checked={isChecked}
                                                                onChange={() => handleSelectOption(mcq._id, optIdx)}
                                                                className="w-4 h-4 accent-[#d4af37] border-white/20 bg-slate-950 focus:ring-0 focus:outline-none"
                                                            />
                                                            <span className="text-[#d4af37] font-black">{optionLetter}.</span>
                                                            <span className="leading-snug">{option}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <button
                                type="button"
                                disabled={currentPage === 1 || loadingQuestions}
                                onClick={() => fetchQuestionsBatch(currentPage - 1)}
                                className="px-4 py-2 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1.5">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            disabled={loadingQuestions}
                                            onClick={() => fetchQuestionsBatch(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                                currentPage === pageNum ? "bg-[#0f4c81] text-white" : "bg-slate-950 border border-white/5 text-slate-400 hover:text-white"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                disabled={currentPage === totalPages || loadingQuestions}
                                onClick={() => fetchQuestionsBatch(currentPage + 1)}
                                className="px-4 py-2 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
            </main>

            {/* Confirm submit dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fadeIn">
                        <h4 className="text-lg font-black text-white mb-2">Submit Mock Exam?</h4>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">
                            You have answered <strong className="text-[#d4af37]">{answeredCount}</strong> out of{" "}
                            <strong className="text-white">{questions.length}</strong> questions on this page. Are you sure you want to finish and grade your submission?
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                            >
                                Continue Exam
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleSubmitTest}
                                className="px-5 py-2.5 bg-[#0f4c81] hover:bg-[#115894] text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {submitting ? "Grading..." : "Yes, Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </UserPortalBackground>
    );
}

export default function UserTestPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        }>
            <UserTestPageInner />
        </Suspense>
    );
}

