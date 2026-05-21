import Link from "next/link";
import type { ReactNode } from "react";

export function UserPortalBackground({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#070b14] text-white selection:bg-[#d4af37]/30 pb-20 relative overflow-hidden">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div className="pointer-events-none absolute top-[-15%] left-[-5%] h-[55%] w-[55%] rounded-full bg-[#0f4c81]/20 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d4af37]/10 blur-[120px]" />
            <div className="pointer-events-none absolute top-[40%] right-[20%] h-[30%] w-[25%] rounded-full bg-[#1e6f9f]/15 blur-[100px]" />
            {children}
        </div>
    );
}

export function TestPaperIllustration({ className = "" }: { className?: string }) {
    return (
        <div
            className={`relative mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-5 shadow-2xl shadow-black/40 ${className}`}
        >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#0f4c81]/40 border border-[#0f4c81]/50 flex items-center justify-center">
                        <svg className="h-4 w-4 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Mock Test Paper</p>
                        <p className="text-xs font-semibold text-white">Ahmad Foundation</p>
                    </div>
                </div>
                <span className="rounded-md bg-[#d4af37]/15 px-2 py-0.5 text-[10px] font-bold text-[#d4af37] border border-[#d4af37]/25">
                    MCQ
                </span>
            </div>
            {[1, 2, 3].map((n) => (
                <div key={n} className="mb-4 last:mb-0">
                    <div className="flex gap-2 mb-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0f4c81]/30 text-[10px] font-black text-[#d4af37]">
                            {n}
                        </span>
                        <div className="h-2 flex-1 rounded bg-white/10 mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-7">
                        {["A", "B", "C", "D"].map((opt) => (
                            <div
                                key={opt}
                                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] ${
                                    n === 1 && opt === "B"
                                        ? "border-[#0f4c81]/50 bg-[#0f4c81]/20 text-white"
                                        : "border-white/5 bg-white/[0.02] text-slate-500"
                                }`}
                            >
                                <span className="font-bold text-[#d4af37]/80">{opt}</span>
                                <span className="h-1.5 flex-1 rounded bg-white/10" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className="mt-4 flex justify-between text-[10px] text-slate-500 border-t border-white/5 pt-3">
                <span>10 Questions · Timed</span>
                <span className="text-[#d4af37] font-semibold">Practice Mode</span>
            </div>
        </div>
    );
}

type StepItem = { num: number; title: string; desc: string; active?: boolean; done?: boolean };

export function StepsGuide({ steps }: { steps: StepItem[] }) {
    return (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
                <li
                    key={step.num}
                    className={`rounded-xl border p-4 transition-all ${
                        step.active
                            ? "border-[#d4af37]/40 bg-[#d4af37]/5 shadow-lg shadow-[#d4af37]/5"
                            : step.done
                              ? "border-emerald-500/20 bg-emerald-500/5"
                              : "border-white/5 bg-white/[0.02]"
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                                step.active
                                    ? "bg-[#d4af37] text-slate-950"
                                    : step.done
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-white/5 text-slate-500"
                            }`}
                        >
                            {step.done ? "✓" : step.num}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Step {step.num}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                </li>
            ))}
        </ol>
    );
}

export function EmptyHistoryCard() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-10 sm:p-14 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f4c81_0%,_transparent_70%)] opacity-20" />
            <div className="relative z-10">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0f4c81]/20 border border-[#0f4c81]/30">
                    <svg className="h-10 w-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h4 className="text-lg font-black text-white mb-2">No test papers attempted yet</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                    Your practice history will appear here after you complete a mock exam. Start with your grade, subject, and test level in the practice room.
                </p>
                <Link
                    href="/user/test"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0f4c81]/25 hover:from-[#d4af37] hover:to-[#b8960c] transition-all"
                >
                    Open Practice Room
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

export function StatCard({
    label,
    value,
    suffix = "",
    accent = "blue",
    emptyHint,
}: {
    label: string;
    value: number;
    suffix?: string;
    accent?: "blue" | "gold" | "green";
    emptyHint?: string;
}) {
    const accents = {
        blue: "bg-[#0f4c81]/25 border-[#0f4c81]/20 text-sky-400",
        gold: "bg-[#d4af37]/15 border-[#d4af37]/20 text-[#d4af37]",
        green: "bg-green-500/10 border-green-500/20 text-green-400",
    };
    const isEmpty = value === 0;

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
            <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</div>
                <div className={`text-2xl font-black mt-1 ${isEmpty ? "text-slate-600" : "text-white"}`}>
                    {isEmpty ? "—" : `${value}${suffix}`}
                </div>
                {isEmpty && emptyHint && (
                    <p className="text-[10px] text-slate-500 mt-1">{emptyHint}</p>
                )}
            </div>
            <div className={`p-3 rounded-lg border ${accents[accent]}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
        </div>
    );
}
