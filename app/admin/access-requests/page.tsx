"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";

type RequestItem = {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    } | null;
    classId: {
        _id: string;
        name: string;
    } | null;
    status: "pending" | "approved" | "rejected";
    paymentMethod: string;
    paymentDetails: string;
    createdAt: string;
};

export default function AdminAccessRequestsPage() {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/admin/payment-requests");
            const data = await res.json();
            if (res.ok && data.success) {
                setRequests(data.requests || []);
            } else {
                setError(data.error || "Failed to load access requests.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch access requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRequests();
    }, []);

    const handleAction = async (accessId: string, status: "approved" | "rejected") => {
        try {
            setBusyId(accessId);
            setError(null);
            setSuccess(null);

            const res = await fetch("/api/admin/payment-requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessId, status }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(`Request successfully ${status}.`);
                await fetchRequests();
            } else {
                setError(data.error || `Failed to ${status} request.`);
            }
        } catch (err) {
            console.error(err);
            setError(`An error occurred while trying to ${status} request.`);
        } finally {
            setBusyId(null);
        }
    };

    const filtered = requests.filter((r) => {
        if (filter === "pending") return r.status === "pending";
        if (filter === "approved") return r.status === "approved";
        if (filter === "rejected") return r.status === "rejected";
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const pendingCount = requests.filter(r => r.status === "pending").length;
    const approvedCount = requests.filter(r => r.status === "approved").length;
    const rejectedCount = requests.filter(r => r.status === "rejected").length;

    return (
        <AdminShell
            title="Class Access Requests"
            subtitle="Approve or Reject Student Premium Class Access and Payments"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Pending Requests</p>
                    <p className="text-xs text-slate-500 mt-1">Requires review & action</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-emerald-600">{approvedCount}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Approved Access</p>
                    <p className="text-xs text-slate-500 mt-1">Students with unlocked classes</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-red-50">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-red-600">{rejectedCount}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Rejected Requests</p>
                    <p className="text-xs text-slate-500 mt-1">Denied class requests</p>
                </div>
            </div>

            {/* Alerts */}
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

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-50">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Access Requests
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {filtered.length} {filtered.length === 1 ? 'request' : 'requests'} found
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFilter("all")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    filter === "all"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("pending")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    filter === "pending"
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                Pending
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("approved")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    filter === "approved"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                Approved
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("rejected")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    filter === "rejected"
                                        ? "bg-red-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                Rejected
                            </button>
                            <button
                                type="button"
                                onClick={fetchRequests}
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
                        <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
                        <p className="text-sm text-slate-500 mt-4">Loading requests...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400">No requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-4 pl-6 pr-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Class Requested
                                    </th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Payment Method
                                    </th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Payment Details / Trans ID
                                    </th>
                                    <th className="text-center py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Requested At
                                    </th>
                                    <th className="text-right py-4 pr-6 pl-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((req) => (
                                    <tr key={req._id} className="hover:bg-slate-50 transition-colors group text-sm">
                                        <td className="py-4 pl-6 pr-4">
                                            {req.userId ? (
                                                <div>
                                                    <p className="font-semibold text-slate-700">{req.userId.name}</p>
                                                    <p className="text-xs text-slate-400">{req.userId.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium">Deleted User</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-semibold text-slate-700">
                                                {req.classId ? `Class ${req.classId.name}` : "Deleted Class"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-medium text-slate-600 uppercase">
                                                {req.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-slate-600 max-w-xs truncate font-mono text-xs">
                                                {req.paymentDetails || "—"}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                req.status === "approved"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : req.status === "rejected"
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-amber-50 text-amber-700 animate-pulse"
                                            }`}>
                                                {req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-xs text-slate-500">{formatDate(req.createdAt)}</span>
                                        </td>
                                        <td className="py-4 pr-6 pl-4 text-right">
                                            {req.status === "pending" && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={busyId !== null}
                                                        onClick={() => handleAction(req._id, "approved")}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busyId !== null}
                                                        onClick={() => handleAction(req._id, "rejected")}
                                                        className="px-3 py-1.5 rounded-lg bg-red-150 text-red-700 hover:bg-red-200 text-xs font-semibold transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {req.status === "approved" && (
                                                <button
                                                    type="button"
                                                    disabled={busyId !== null}
                                                    onClick={() => handleAction(req._id, "rejected")}
                                                    className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs font-semibold transition-all"
                                                >
                                                    Revoke Access
                                                </button>
                                            )}
                                            {req.status === "rejected" && (
                                                <button
                                                    type="button"
                                                    disabled={busyId !== null}
                                                    onClick={() => handleAction(req._id, "approved")}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold transition-all"
                                                >
                                                    Re-approve
                                                </button>
                                            )}
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