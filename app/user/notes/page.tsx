"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NoteClassCouponRedeem from "@/components/NoteClassCouponRedeem";
import NoteCouponRedeem from "@/components/NoteCouponRedeem";
import {
    UserPortalBackground,
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

type NoteItem = {
    _id: string;
    name: string;
    description: string;
    imageUrl?: string;
    pdfUrl: string;
};

const WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "";

export default function UserNotesPage() {
    const router = useRouter();
    const [loadingUser, setLoadingUser] = useState(true);

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [notes, setNotes] = useState<NoteItem[]>([]);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");

    const [paymentMethod, setPaymentMethod] = useState<"easypaisa" | "jazzcash" | "whatsapp">("easypaisa");
    const [paymentDetails, setPaymentDetails] = useState("");
    const [submittingAccess, setSubmittingAccess] = useState(false);

    const [loadingNotes, setLoadingNotes] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [couponRedeemed, setCouponRedeemed] = useState(false);

    // Load user classes for notes
    const loadClasses = async () => {
        try {
            const res = await fetch("/api/user/note-classes");
            if (res.ok) {
                const data = await res.json();
                setClasses(data.classes || []);
            }
        } catch (err) {
            console.error("Classes load error:", err);
        }
    };

    // Verify session
    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (!res.ok) {
                    router.push("/login");
                    return;
                }
                await loadClasses();
            } catch (err) {
                console.error("Session verification error:", err);
            } finally {
                setLoadingUser(false);
            }
        };
        verifySession();
    }, [router]);

    const activeClass = classes.find((c) => c._id === selectedClass);
    const activeClassStatus = activeClass?.status || "locked";

    // Fetch subjects when class changes
    useEffect(() => {
        if (!selectedClass || activeClassStatus !== "approved") {
            setSubjects([]);
            setSelectedSubject([]);
            setNotes([]);
            return;
        }
        const fetchSubjects = async () => {
            try {
                setLoadingSubjects(true);
                const res = await fetch(`/api/user/subjects?classId=${selectedClass}`);
                if (res.ok) {
                    const data = await res.json();
                    setSubjects(data.subjects || []);
                    setSelectedSubject("");
                    setNotes([]);
                }
            } catch (err) {
                console.error("Error loading subjects:", err);
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, [selectedClass, activeClassStatus]);

    // Fetch notes when subject changes
    useEffect(() => {
        if (!selectedClass || !selectedSubject || activeClassStatus !== "approved") {
            setNotes([]);
            return;
        }
        const fetchNotesList = async () => {
            try {
                setLoadingNotes(true);
                setError(null);
                const res = await fetch(`/api/user/notes?classId=${selectedClass}&subjectId=${selectedSubject}`);
                const data = await res.json();
                if (res.ok && data.success) {
                    setNotes(data.notes || []);
                } else {
                    setError(data.error || "Failed to load notes.");
                }
            } catch (err) {
                console.error("Error loading notes:", err);
                setError("Failed to load notes.");
            } finally {
                setLoadingNotes(false);
            }
        };
        fetchNotesList();
    }, [selectedClass, selectedSubject, activeClassStatus]);

    const handleCouponSuccess = async () => {
        setCouponRedeemed(true);
        setSuccessMsg("Coupon redeemed successfully! Class unlocked.");
        setError(null);
        await loadClasses();
    };

    const handleNoteCouponSuccess = async () => {
        setSuccessMsg("Note coupon redeemed successfully! Notes unlocked.");
        setError(null);
        // Reload notes to show newly unlocked ones
        if (selectedClass && selectedSubject) {
            try {
                const res = await fetch(`/api/user/notes?classId=${selectedClass}&subjectId=${selectedSubject}`);
                const data = await res.json();
                if (res.ok && data.success) {
                    setNotes(data.notes || []);
                }
            } catch (err) {
                console.error("Error reloading notes:", err);
            }
        }
    };

    const submitAccessRequest = async (method: "easypaisa" | "jazzcash" | "whatsapp", details: string) => {
        if (!selectedClass) return;
        setSubmittingAccess(true);
        setError(null);
        setSuccessMsg(null);
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
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmittingAccess(false);
        }
    };

    const handleWhatsAppAccessRequest = async () => {
        await submitAccessRequest("whatsapp", "Contacted via WhatsApp for premium access");
    };

    const activeClassName = activeClass?.name || "";
    const activeSubjectName = subjects.find((s) => s._id === selectedSubject)?.name || "";

    const setupSteps = [
        { num: 1, title: "Select class", desc: "Choose unlocked grade", active: !selectedClass, done: !!selectedClass },
        { num: 2, title: "Choose subject", desc: "Select class subjects", active: !!selectedClass && !selectedSubject, done: !!selectedSubject },
        { num: 3, title: "Browse Notes", desc: "Download study notes", active: !!selectedSubject, done: notes.length > 0 },
    ];

    if (loadingUser) {
        return (
            <UserPortalBackground>
                <div className="min-h-screen flex flex-col justify-center items-center gap-4 relative z-10">
                    <svg className="animate-spin h-10 w-10 text-[#d4af37]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-400 text-sm animate-pulse">Opening class notes...</p>
                </div>
            </UserPortalBackground>
        );
    }

    return (
        <UserPortalBackground>
            <div className="relative">
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
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4af37]">Tuition Portal</p>
                            <p className="text-sm font-black text-white">Class & Study Notes</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold hidden sm:block">Ahmad Foundation</span>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 relative z-10 pb-8">
                    <div className="animate-fadeIn">
                        {/* Page heading */}
                        <div className="mb-8">
                            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-2 text-center lg:text-left">
                                Study Guides · PDF Notes
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-black text-center lg:text-left bg-gradient-to-r from-white via-slate-100 to-[#d4af37] bg-clip-text text-transparent">
                                Download Class Notes
                            </h1>
                            <p className="text-slate-400 text-sm mt-2 text-center lg:text-left max-w-xl">
                                Select your class and subject to view and download official preparation notes.
                            </p>
                        </div>

                        <div className="mb-8 hidden lg:block">
                            <StepsGuide steps={setupSteps} />
                        </div>

                        <div className="grid lg:grid-cols-5 gap-8 items-start">
                            {/* ── Left: Selectors / Access Panel ── */}
                            <div className="lg:col-span-3 bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                                    <div className="h-11 w-11 rounded-xl bg-[#0f4c81]/30 border border-[#0f4c81]/40 flex items-center justify-center">
                                        <svg className="h-5 w-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white">Select Configuration</h2>
                                        <p className="text-slate-500 text-xs">Access subjects and notes</p>
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
                                    {/* ── STEP 1: Class (lists all classes) ── */}
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
                                                setSelectedSubject("");
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
                                                    {/* Coupon Redemption for Note Class Access */}
                                                    <div>
                                                        <NoteClassCouponRedeem classId={selectedClass} onSuccess={handleCouponSuccess} />
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

                                    {/* ── STEP 2: Subject (only if approved) ── */}
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
                                                    <p className="text-slate-400 text-xs">No subjects available for this class.</p>
                                                </div>
                                            ) : (
                                                <select
                                                    value={selectedSubject}
                                                    onChange={(e) => {
                                                        setSelectedSubject(e.target.value);
                                                        setError(null);
                                                    }}
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

                                    {/* ── Note Coupon Redemption (after subject selected) ── */}
                                    {selectedClass && activeClassStatus === "approved" && selectedSubject && (
                                        <div className="animate-fadeIn bg-slate-950/60 border border-white/10 rounded-2xl p-6 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                </span>
                                                <div>
                                                    <h3 className="text-sm font-black text-white mb-1">
                                                        Unlock Notes with Coupon
                                                    </h3>
                                                    <p className="text-slate-400 text-xs leading-relaxed">
                                                        Have a note access coupon? Redeem it here to unlock all notes for {activeSubjectName}.
                                                    </p>
                                                </div>
                                            </div>
                                            <NoteCouponRedeem 
                                                classId={selectedClass} 
                                                subjectId={selectedSubject}
                                                onSuccess={handleNoteCouponSuccess} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Right: Illustration + Info ── */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
                                    <h4 className="text-xs font-black text-[#d4af37] uppercase tracking-wider mb-3">Tuition Notes Benefits</h4>
                                    <ul className="space-y-2.5 text-[11px] text-slate-400">
                                        <li className="flex gap-2"><span className="text-emerald-400">✓</span> Verified PDFs compiled by teachers</li>
                                        <li className="flex gap-2"><span className="text-emerald-400">✓</span> Instant download links</li>
                                        <li className="flex gap-2"><span className="text-emerald-400">✓</span> Full curriculum & chapter guides</li>
                                        <li className="flex gap-2"><span className="text-emerald-400">✓</span> Lifetime access to unlocked notes</li>
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-5">
                                    <h4 className="text-xs font-black text-[#d4af37] mb-2">Need a coupon code?</h4>
                                    <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                                        Coupon codes are provided to tuition students by administrators. Redeeming a code grants instant permanent access.
                                    </p>
                                    <Link href="/user/dashboard" className="text-[#d4af37] text-xs font-bold hover:underline">
                                        Back to Dashboard →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ── Notes Display Grid (when subject is selected) ── */}
                        {selectedClass && selectedSubject && activeClassStatus === "approved" && (
                            <section className="mt-10 animate-fadeIn">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                    <div>
                                        <h2 className="text-xl font-black text-white">Notes Available</h2>
                                        <p className="text-slate-400 text-xs mt-1">
                                            Preparation material for Class {activeClassName} · {activeSubjectName}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-[#d4af37] bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/20">
                                        {notes.length} {notes.length === 1 ? "Note" : "Notes"}
                                    </span>
                                </div>

                                {loadingNotes ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-10 h-10 rounded-full border-3 border-slate-700 border-t-[#d4af37] animate-spin" />
                                        <p className="text-slate-400 text-sm mt-4 animate-pulse">Loading study notes...</p>
                                    </div>
                                ) : notes.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-3xl">
                                        <svg className="mx-auto h-12 w-12 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="text-base font-bold text-white mb-1">No Study Notes Found</h3>
                                        <p className="text-slate-400 text-xs max-w-sm mx-auto">
                                            Preparation notes have not been uploaded for {activeSubjectName} yet. Contact your teacher or check back later!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {notes.map((note) => (
                                            <article
                                                key={note._id}
                                                className="group bg-slate-900/60 border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <h3 className="font-bold text-white text-base group-hover:text-[#d4af37] transition">
                                                            {note.name}
                                                        </h3>
                                                        <span className="shrink-0 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                            Unlocked
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                                                        {note.description}
                                                    </p>

                                                    {note.imageUrl && (
                                                        <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-950 flex items-center justify-center relative">
                                                            <img
                                                                src={note.imageUrl}
                                                                alt={note.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <a
                                                    href={note.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] hover:from-[#d4af37] hover:to-[#b8960c] text-white font-bold text-xs py-3 transition shadow-md shadow-[#0f4c81]/10 mt-auto cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download PDF Note
                                                </a>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </UserPortalBackground>
    );
}
