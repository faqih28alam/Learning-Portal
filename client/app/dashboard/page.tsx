"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { questionsAPI, Question } from "@/lib/api";
import { getUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import { QuestionCardSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
    const { show, ToastEl } = useToast();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", body: "", answer_key: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const user = getUser();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const user = getUser();
        if (!user) { router.push("/login"); return; }
        if (user.role !== "teacher") { router.push("/questions"); return; }

        fetchQuestions();
    }, [mounted]);

    const fetchQuestions = () => {
        questionsAPI.list()
            .then((res) => setQuestions(res.data.questions || []))
            .finally(() => setLoading(false));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            await questionsAPI.create(form);
            show("Question created successfully!", "success")
            setForm({ title: "", body: "", answer_key: "" });
            setShowForm(false);
            fetchQuestions();
        } catch (err: any) {
            show(err.response?.data?.error || "Failed to create question.", "error");
            setError("");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this question?")) return;
        await questionsAPI.delete(id);
        show("Question deleted.", "success");
        fetchQuestions();
    };

    if (!mounted || loading) return (
        <div className="min-h-screen bg-stone-50">
            <NavBar />
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <div className="h-10 w-40 bg-stone-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-28 bg-stone-200 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-36 bg-stone-200 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <QuestionCardSkeleton key={i} />)}
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50">
            {ToastEl}
            <NavBar />

            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 fade-up">
                    <div>
                        <h1 className="font-display text-4xl text-stone-900 mb-1">Dashboard</h1>
                        <p className="text-stone-500">{questions.length} question{questions.length !== 1 ? "s" : ""} created</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium
                       hover:bg-stone-800 active:scale-[0.98] transition-all"
                    >
                        {showForm ? "Cancel" : "+ New Question"}
                    </button>
                </div>

                {/* Create form */}
                {showForm && (
                    <form
                        onSubmit={handleCreate}
                        className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6 fade-up space-y-4"
                    >
                        <h2 className="font-display text-xl text-stone-900">New Question</h2>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">Title</label>
                            <input
                                required
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="E.g. Explain photosynthesis"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                                Question Body
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={form.body}
                                onChange={(e) => setForm({ ...form, body: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                                placeholder="Write the full question text…"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                                Answer Key <span className="text-stone-400 normal-case">(only you can see this)</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={form.answer_key}
                                onChange={(e) => setForm({ ...form, answer_key: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 text-sm
                           focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none"
                                placeholder="Write the ideal reference answer…"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-stone-900 text-white px-6 py-3 rounded-xl text-sm font-medium
                         hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Create Question"}
                        </button>
                    </form>
                )}

                {/* Question list */}
                {questions.length === 0 && !showForm ? (
                    <div className="text-center py-20 text-stone-400 fade-up-delay-1">
                        <div className="text-5xl mb-4">📝</div>
                        <p>No questions yet. Create your first one!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q, i) => (
                            <div
                                key={q.id}
                                className={`fade-up fade-up-delay-${Math.min(i + 1, 3)} bg-white rounded-2xl border border-stone-100
                             shadow-sm p-6 flex items-start justify-between gap-4`}
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs text-stone-400 font-mono">#{q.id}</span>
                                    <h3 className="font-semibold text-stone-900 mt-0.5">{q.title}</h3>
                                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">{q.body}</p>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => router.push(`/dashboard/questions/${q.id}/submissions`)}
                                        className="text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-medium"
                                    >
                                        Submissions
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}