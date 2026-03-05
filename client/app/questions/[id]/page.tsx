"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { questionsAPI, studentAPI, Question, Submission } from "@/lib/api";
import { getUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import ScoreBadge from "@/components/ScoreBadge";

export default function AnswerPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [question, setQuestion] = useState<Question | null>(null);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState<{
        score: number;
        score_percent: string;
    } | null>(null);
    const [history, setHistory] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const MIN_CHARS = 10;

    // Step 1: wait for client mount before touching localStorage
    useEffect(() => {
        setMounted(true);
    }, []);

    // Step 2: only run auth + data fetch after mounted
    useEffect(() => {
        if (!mounted) return;

        const user = getUser();
        if (!user) {
            router.push("/login");
            return;
        }
        if (user.role === "teacher") {
            router.push("/dashboard");
            return;
        }

        Promise.all([
            questionsAPI.get(Number(id)),
            studentAPI.mySubmissions(),
        ])
            .then(([qRes, sRes]) => {
                setQuestion(qRes.data);
                const all = sRes.data.submissions || [];
                setHistory(all.filter((s) => s.question_id === Number(id)));
            })
            .catch(() => router.push("/questions"))
            .finally(() => setLoading(false));
    }, [mounted, id]);

    const handleSubmit = async () => {
        if (answer.trim().length < MIN_CHARS) return;
        setError("");
        setSubmitting(true);

        try {
            const res = await questionsAPI.submit(Number(id), answer.trim());
            setResult(res.data);

            // Refresh history
            const sRes = await studentAPI.mySubmissions();
            const updated = (sRes.data.submissions || []).filter(
                (s) => s.question_id === Number(id)
            );
            setHistory(updated);
        } catch (err: any) {
            setError(err.response?.data?.error || "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    // Don't render anything until client is mounted
    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-stone-50">
                <NavBar />
                <main className="max-w-3xl mx-auto px-6 py-10">
                    <div className="h-4 w-28 bg-stone-200 rounded animate-pulse mb-6" />
                    {/* Question card skeleton */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 space-y-3">
                        <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
                        <div className="h-8 w-2/3 bg-stone-200 rounded animate-pulse" />
                        <div className="h-4 w-full bg-stone-200 rounded animate-pulse" />
                    </div>
                    {/* Form skeleton */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
                        <div className="h-3 w-24 bg-stone-200 rounded animate-pulse" />
                        <div className="h-36 w-full bg-stone-200 rounded-xl animate-pulse" />
                        <div className="h-12 w-full bg-stone-200 rounded-xl animate-pulse" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            <NavBar />

            <main className="max-w-3xl mx-auto px-6 py-10">
                {/* Back */}
                <button
                    onClick={() => router.push("/questions")}
                    className="text-sm text-stone-500 hover:text-stone-900 mb-6 flex items-center gap-1 transition-colors"
                >
                    ← Back to questions
                </button>

                {/* Question card */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6">
                    <span className="text-xs text-stone-400 font-mono mb-2 block">
                        Question #{question?.id}
                    </span>
                    <h1 className="font-display text-2xl text-stone-900 mb-3">
                        {question?.title}
                    </h1>
                    <p className="text-stone-600 leading-relaxed">{question?.body}</p>
                </div>

                {/* Score result OR answer form */}
                {result ? (
                    <div className="space-y-4">
                        <ScoreBadge score={result.score} />
                        <button
                            onClick={() => {
                                setResult(null);
                                setAnswer("");
                            }}
                            className="w-full py-3 rounded-xl border border-stone-200 text-sm
                         text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    /* ── Answer form — this is what was missing ── */
                    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
                        <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide">
                            Your Answer
                        </label>

                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={7}
                            placeholder="Write your answer here…"
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm
                         text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500
                         transition resize-none leading-relaxed"
                        />

                        <div className="flex items-center justify-between">
                            <span
                                className={`text-xs ${answer.length < MIN_CHARS
                                    ? "text-stone-400"
                                    : "text-green-600"
                                    }`}
                            >
                                {answer.length} characters
                                {answer.length < MIN_CHARS && ` (min ${MIN_CHARS})`}
                            </span>
                            {error && (
                                <span className="text-xs text-red-500">{error}</span>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || answer.trim().length < MIN_CHARS}
                            className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm
                         font-medium hover:bg-stone-800 active:scale-[0.98]
                         transition-all disabled:opacity-40"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Scoring…
                                </span>
                            ) : (
                                "Submit & Score"
                            )}
                        </button>
                    </div>
                )}

                {/* Past attempts */}
                {history.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
                            Past Attempts
                        </h2>
                        <div className="space-y-2">
                            {history.map((s) => (
                                <div
                                    key={s.id}
                                    className="bg-white rounded-xl border border-stone-100 px-5 py-4
                             flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-sm text-stone-700 line-clamp-1">
                                            {s.answer_text}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-1">
                                            {new Date(s.submitted_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div
                                        className={`text-sm font-semibold ml-4 flex-shrink-0 px-3 py-1 rounded-lg
                      ${s.score >= 0.85
                                                ? "text-green-600 bg-green-50"
                                                : s.score >= 0.7
                                                    ? "text-blue-600 bg-blue-50"
                                                    : s.score >= 0.5
                                                        ? "text-amber-600 bg-amber-50"
                                                        : "text-red-600 bg-red-50"
                                            }`}
                                    >
                                        {Math.round(s.score * 100)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}