"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";

type ClassOption = { _id: string; name: string };

type CouponRow = {
    id: string;
    classId: string;
    className: string;
    isUsed: boolean;
    isActive: boolean;
    usedBy: { name: string; email: string } | null;
    usedAt: string | null;
    createdAt: string;
};

type GeneratedCoupon = {
    id: string;
    code: string;
    className: string;
};

export default function AdminNoteCouponsPage() {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [classId, setClassId] = useState("");
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [generated, setGenerated] = useState<GeneratedCoupon[]>([]);
    const [filter, setFilter] = useState<"all" | "available" | "used" | "inactive">("all");
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchClasses = async () => {
        const res = await fetch("/api/classes");
        const data = await res.json();
        if (res.ok && data.success) {
            setClasses(
                (data.data || []).map((c: { _id: string; name: string }) => ({
                    _id: c._id,
                    name: c.name,
                }))
            );
        }
    };

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/admin/notes/coupons");
            const data = await res.json();
            if (res.ok && data.success) {
                setCoupons(data.coupons || []);
            } else {
                setError(data.error || "Failed to load coupons.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch coupons.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchClasses();
        void fetchCoupons();
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classId) {
            setError("Please select a class.");
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setSuccess(null);
            setGenerated([]);

            const res = await fetch("/api/admin/notes/coupons/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId, count: 1 }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(data.message);
                setGenerated(data.coupons || []);
                await fetchCoupons();
            } else {
                setError(data.error || "Generation failed.");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong while generating coupons.");
        } finally {
            setGenerating(false);
        }
    };

    const copySingleCode = (code: string) => {
        void navigator.clipboard.writeText(code);
        setSuccess(`Code "${code}" copied to clipboard.`);
    };

    const handleDeactivate = async (id: string) => {
        try {
            setBusyId(id);
            const res = await fetch(`/api/admin/notes/coupons/${id}`, { method: "PATCH" });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                await fetchCoupons();
            } else {
                setError(data.error || "Failed to deactivate.");
            }
        } catch (err) {
            console.error(err);
            setError("Deactivate failed.");
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this coupon permanently?")) return;
        try {
            setBusyId(id);
            const res = await fetch(`/api/admin/notes/coupons/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                await fetchCoupons();
            } else {
                setError(data.error || "Failed to delete.");
            }
        } catch (err) {
            console.error(err);
            setError("Delete failed.");
        } finally {
            setBusyId(null);
        }
    };

    const filtered = coupons.filter((c) => {
        if (filter === "available") return c.isActive && !c.isUsed;
        if (filter === "used") return c.isUsed;
        if (filter === "inactive") return !c.isActive;
        return true;
    });

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "—";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const availableCount = coupons.filter(c => c.isActive && !c.isUsed).length;
    const usedCount = coupons.filter(c => c.isUsed).length;
    const inactiveCount = coupons.filter(c => !c.isActive).length;

    return (
        <AdminShell
            title="Note Access Coupons"
            subtitle="Generate class-level unlock codes — students redeem to access all notes for a class"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-emerald-600">{availableCount}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Available Coupons</p>
                    <p className="text-xs text-slate-500 mt-1">Ready for distribution</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-[#0f4c81]/10">
                            <svg className="w-5 h-5 text-[#0f4c81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-[#0f4c81]">{usedCount}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Used Coupons</p>
                    <p className="text-xs text-slate-500 mt-1">Already redeemed by students</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-amber-600">{inactiveCount}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Inactive Coupons</p>
                    <p className="text-xs text-slate-500 mt-1">Deactivated or expired</p>
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

            {/* Generate Form */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0f4c81] via-[#1e6f9f] to-[#d4af37]" />
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0f4c81]/10">
                                <svg className="w-5 h-5 text-[#0f4c81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Generate Note Access Coupon
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Select a class — the coupon will unlock all notes for that class</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Class / Grade
                                </label>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/20 focus:border-[#0f4c81] transition-all"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map((cls) => (
                                        <option key={cls._id} value={cls._id}>
                                            Grade {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={generating || !classId}
                                    className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0f4c81] to-[#1e6f9f] text-sm font-bold text-white shadow-md shadow-[#0f4c81]/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {generating ? "Generating..." : "Generate Notes Access Coupon"}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                            Each coupon grants one student access to all notes for the selected class. Only one coupon is generated at a time.
                        </p>
                    </form>
                </div>
            </div>

            {/* Generated Code Display */}
            {generated.length > 0 && (
                <div className="bg-gradient-to-r from-[#0f4c81]/5 to-[#d4af37]/5 rounded-2xl shadow-lg border border-[#0f4c81]/20 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0f4c81]/10">
                                <svg className="w-5 h-5 text-[#0f4c81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0f4c81]">New Code Generated!</h3>
                                <p className="text-xs text-slate-500">Copy this code and share it with the student</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {generated.map((c) => (
                            <div
                                key={c.id}
                                className="group flex items-center justify-between gap-3 rounded-xl bg-white border border-[#0f4c81]/20 px-5 py-4 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => copySingleCode(c.code)}
                            >
                                <div>
                                    <code className="font-mono text-lg font-bold text-[#0f4c81]">{c.code}</code>
                                    <p className="text-xs text-slate-400 mt-0.5">Unlocks all notes for Grade {c.className}</p>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f4c81]/10 text-[#0f4c81] text-xs font-semibold hover:bg-[#0f4c81]/20 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0f4c81]/10">
                                <svg className="w-5 h-5 text-[#0f4c81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">All Note Coupons</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{filtered.length} {filtered.length === 1 ? "record" : "records"} found</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {(["all", "available", "used", "inactive"] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                                        filter === f
                                            ? f === "available" ? "bg-emerald-600 text-white shadow-sm"
                                            : f === "used" ? "bg-slate-600 text-white shadow-sm"
                                            : f === "inactive" ? "bg-amber-600 text-white shadow-sm"
                                            : "bg-[#0f4c81] text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => void fetchCoupons()}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0f4c81] animate-spin" />
                        <p className="text-sm text-slate-500 mt-4">Loading coupons...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400">No coupons found</p>
                        <p className="text-xs text-slate-400 mt-1">Generate a coupon using the form above</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-4 pl-6 pr-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Class</th>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Redeemed By</th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Used At</th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                                    <th className="text-right py-4 pr-6 pl-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 pl-6 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f4c81]/20 to-[#0f4c81]/10 flex items-center justify-center">
                                                    <span className="text-[#0f4c81] font-bold text-sm">{c.className.charAt(0)}</span>
                                                </div>
                                                <span className="font-semibold text-slate-700">Grade {c.className}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                c.isUsed
                                                    ? "bg-slate-100 text-slate-600"
                                                    : c.isActive
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-amber-50 text-amber-700"
                                            }`}>
                                                {c.isUsed ? "Used" : c.isActive ? "Available" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {c.usedBy ? (
                                                <div>
                                                    <p className="font-semibold text-slate-700 text-sm">{c.usedBy.name}</p>
                                                    <p className="text-xs text-slate-400">{c.usedBy.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-slate-500">{formatDate(c.usedAt)}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-slate-500">{formatDate(c.createdAt)}</span>
                                        </td>
                                        <td className="py-4 pr-6 pl-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {c.isActive && !c.isUsed && (
                                                    <button
                                                        type="button"
                                                        disabled={busyId !== null}
                                                        onClick={() => handleDeactivate(c.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold transition-all"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={busyId !== null}
                                                    onClick={() => handleDelete(c.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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
