"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";

type ClassOption = { _id: string; name: string };
type SubjectOption = { _id: string; name: string };

type CouponRow = {
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
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
    subjectName: string;
};

export default function AdminNoteCouponsPage() {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [classId, setClassId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
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

    const fetchSubjects = async (selectedClassId: string) => {
        try {
            setLoadingSubjects(true);
            const res = await fetch(`/api/subjects?classId=${selectedClassId}`);
            const data = await res.json();
            if (res.ok && data.success) {
                setSubjects(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching subjects:", err);
        } finally {
            setLoadingSubjects(false);
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

    useEffect(() => {
        if (classId) {
            fetchSubjects(classId);
        } else {
            setSubjects([]);
            setSubjectId("");
        }
    }, [classId]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classId || !subjectId) {
            setError("Please select both class and subject.");
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
                body: JSON.stringify({ classId, subjectId, count }),
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

    const copyAllCodes = () => {
        const text = generated.map((c) => c.code).join("\n");
        void navigator.clipboard.writeText(text);
        setSuccess("All codes copied to clipboard.");
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

    const copySingleCode = (code: string) => {
        void navigator.clipboard.writeText(code);
        setSuccess(`Code "${code}" copied to clipboard.`);
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
            subtitle="Generate unlock codes for class notes — students redeem to access premium notes"
        >
            <div className="space-y-6">
                {/* Generation Form */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Generate New Coupons</h2>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Class</label>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Subject</label>
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                    disabled={!classId || loadingSubjects}
                                >
                                    <option value="">
                                        {loadingSubjects ? "Loading..." : "Select Subject"}
                                    </option>
                                    {subjects.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={generating || !classId || !subjectId}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {generating ? "Generating..." : "Generate Coupons"}
                        </button>
                    </form>
                </div>

                {/* Success/Error Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                {/* Generated Coupons Display */}
                {generated.length > 0 && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-green-800">
                                ✓ Generated {generated.length} Coupon{generated.length > 1 ? "s" : ""}
                            </h3>
                            <button
                                onClick={copyAllCodes}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Copy All Codes
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {generated.map((c) => (
                                <div
                                    key={c.id}
                                    className="bg-white p-3 rounded border border-green-300 flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-mono font-bold text-lg">{c.code}</div>
                                        <div className="text-xs text-gray-600">
                                            {c.className} - {c.subjectName}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copySingleCode(c.code)}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex gap-2 border-b">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 font-medium ${
                                filter === "all"
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            All ({coupons.length})
                        </button>
                        <button
                            onClick={() => setFilter("available")}
                            className={`px-4 py-2 font-medium ${
                                filter === "available"
                                    ? "border-b-2 border-green-600 text-green-600"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Available ({availableCount})
                        </button>
                        <button
                            onClick={() => setFilter("used")}
                            className={`px-4 py-2 font-medium ${
                                filter === "used"
                                    ? "border-b-2 border-purple-600 text-purple-600"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Used ({usedCount})
                        </button>
                        <button
                            onClick={() => setFilter("inactive")}
                            className={`px-4 py-2 font-medium ${
                                filter === "inactive"
                                    ? "border-b-2 border-gray-600 text-gray-600"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Inactive ({inactiveCount})
                        </button>
                    </div>
                </div>

                {/* Coupons Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading coupons...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No coupons found for this filter.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Coupon ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Class
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Subject
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Used By
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Used At
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Created
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-mono">
                                                {coupon.id}
                                            </td>
                                            <td className="px-4 py-3 text-sm">{coupon.className}</td>
                                            <td className="px-4 py-3 text-sm">{coupon.subjectName}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {coupon.isUsed ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        Used
                                                    </span>
                                                ) : coupon.isActive ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Available
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {coupon.usedBy ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {coupon.usedBy.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {coupon.usedBy.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(coupon.usedAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(coupon.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex gap-2">
                                                    {coupon.isActive && !coupon.isUsed && (
                                                        <button
                                                            onClick={() => handleDeactivate(coupon.id)}
                                                            disabled={busyId === coupon.id}
                                                            className="text-orange-600 hover:text-orange-800 disabled:text-gray-400"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(coupon.id)}
                                                        disabled={busyId === coupon.id}
                                                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
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
            </div>
        </AdminShell>
    );
}
