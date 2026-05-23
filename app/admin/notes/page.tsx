"use client";

import { useState, useEffect, ChangeEvent } from "react";
import AdminShell from "@/app/admin/AdminShell";

interface Note {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  pdfUrl: string;
  requiresCoupon?: boolean;
  classId?: {
    _id: string;
    name: string;
  };
  subjectId?: {
    _id: string;
    name: string;
  };
}

interface ClassItem {
  _id: string;
  name: string;
}

interface SubjectItem {
  _id: string;
  name: string;
}

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [requiresCoupon, setRequiresCoupon] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Load classes on mount
  useEffect(() => {
    fetchClasses();
    fetchNotes();
  }, []);

  // Fetch subjects when class selection changes
  useEffect(() => {
    if (classId) {
      fetchSubjects(classId);
    } else {
      setSubjects([]);
      setSubjectId("");
    }
  }, [classId]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchSubjects = async (selectedClassId: string) => {
    try {
      const res = await fetch(`/api/subjects?classId=${selectedClassId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSubjects(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchNotes = async () => {
    setLoadingNotes(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notes");
      const data = await res.json();
      if (res.ok && data.success) {
        setNotes(data.notes || []);
      } else {
        setError(data.error || "Failed to load notes");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notes");
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    } else {
      setter(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !description.trim() || !classId || !subjectId || !pdfFile) {
      setError("All fields except description image are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("classId", classId);
    formData.append("subjectId", subjectId);
    formData.append("requiresCoupon", requiresCoupon.toString());
    if (imageFile) {
      formData.append("image", imageFile);
    }
    formData.append("pdf", pdfFile);

    setLoading(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Note created successfully!");
        // Clear form
        setName("");
        setDescription("");
        setClassId("");
        setSubjectId("");
        setRequiresCoupon(false);
        setImageFile(null);
        setPdfFile(null);
        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input: any) => {
          input.value = "";
        });
        await fetchNotes();
      } else {
        setError(data.error || "Failed to create note");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, noteName: string) => {
    if (!confirm(`Are you sure you want to delete the note "${noteName}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Note "${noteName}" deleted successfully.`);
        await fetchNotes();
      } else {
        setError(data.error || "Failed to delete note");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell title="Notes Management" subtitle="Upload and manage notes for classes and subjects">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Form Card */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-24">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Add New Note
                  </h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload a PDF document. Make sure to specify the correct class and subject it belongs to.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Note Name / Title
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    placeholder="e.g. Chapter 1: Introduction to Algebra"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Class
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    required
                    disabled={!classId}
                  >
                    <option value="">
                      {!classId ? "Choose a Class first" : "-- Choose Subject --"}
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    PDF Document
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(e, setPdfFile)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    placeholder="Short description of what the note covers..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Preview Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setImageFile)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <input
                    type="checkbox"
                    id="requiresCoupon"
                    checked={requiresCoupon}
                    onChange={(e) => setRequiresCoupon(e.target.checked)}
                    className="w-4 h-4 text-amber-600 bg-white border-amber-300 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <label htmlFor="requiresCoupon" className="flex-1 cursor-pointer">
                    <span className="block text-xs font-semibold text-amber-800">Requires Coupon to Access</span>
                    <span className="block text-[10px] text-amber-600 mt-0.5">Students will need a coupon code to unlock this note, even if they have class access</span>
                  </label>
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
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-200 px-4 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Note"
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Notes List Section */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-4M9 12h6" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Active Notes
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={fetchNotes}
                    className="text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} configured
                </p>
              </div>

              <div className="p-6">
                {loadingNotes ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin" />
                    <p className="text-sm text-slate-500 mt-4">Loading notes...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400">No notes have been uploaded yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Upload your first note using the form on the left.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notes.map((note) => (
                      <article
                        key={note._id}
                        className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100 transition-all duration-200"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition">
                              {note.name}
                            </h3>
                            <div className="flex gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                                PDF
                              </span>
                              {note.requiresCoupon && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Coupon
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                            {note.description}
                          </p>

                          <div className="space-y-1.5 mb-4 text-xs">
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="font-semibold text-slate-700">Class:</span>
                              <span>{note.classId?.name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="font-semibold text-slate-700">Subject:</span>
                              <span>{note.subjectId?.name || "N/A"}</span>
                            </div>
                          </div>

                          {note.imageUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 flex items-center justify-center">
                              <img
                                src={note.imageUrl}
                                alt={note.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                          <a
                            href={note.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View PDF
                          </a>
                          
                          <button
                            type="button"
                            onClick={() => handleDelete(note._id, note.name)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </article>
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
