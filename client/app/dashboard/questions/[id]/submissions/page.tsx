"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { questionsAPI, Question, Submission } from "@/lib/api";
import { getUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import { SubmissionCardSkeleton, StatCardSkeleton } from "@/components/Skeleton";

export default function SubmissionsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [question, setQuestion] = useState<Question | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const user = getUser();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const user = getUser();
        if (!user || user.role !== "teacher") { router.push("/login"); return; }

        Promise.all([
            questionsAPI.get(Number(id)),
            questionsAPI.getSubmissions(Number(id)),
        ]).then(([qRes, sRes]) => {
            setQuestion(qRes.data);
            setSubmissions(sRes.data.submissions || []);
        }).finally(() => setLoading(false));
    }, [mounted, id]);

    const avgScore = submissions.length
        ? submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length
        : 0;

    const getScoreStyle = (score: number) => {
        if (score >= 0.85) return "text-green-700 bg-green-50 border-green-200";
        if (score >= 0.70) return "text-blue-700 bg-blue-50 border-blue-200";
        if (score >= 0.50) return "text-amber-700 bg-amber-50 border-amber-200";
        return "text-red-700 bg-red-50 border-red-200";
    };

    if (!mounted || loading) return (
        <div className="min-h-screen bg-stone-50">
            <NavBar />
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="h-4 w-32 bg-stone-200 rounded animate-pulse mb-6" />
                <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 space-y-3">
                    <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
                    <div className="h-8 w-1/2 bg-stone-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-stone-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
                </div>
                <div className="space-y-3">
                    {[1, 2].map((i) => <SubmissionCardSkeleton key={i} />)}
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50">
            <NavBar />

            <main className="max-w-4xl mx-auto px-6 py-10">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm text-stone-500 hover:text-stone-900 mb-6 flex items-center gap-1 transition-colors"
                >
                    ← Back to dashboard
                </button>

                {/* Question info */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6 fade-up">
                    <span className="text-xs text-stone-400 font-mono">Question #{question?.id}</span>
                    <h1 className="font-display text-2xl text-stone-900 mt-1 mb-2">{question?.title}</h1>
                    <p className="text-stone-600 text-sm">{question?.body}</p>

                    {question?.answer_key && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Answer Key</p>
                            <p className="text-sm text-amber-900">{question.answer_key}</p>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: "Total Submissions", value: submissions.length },
                        { label: "Average Score", value: `${Math.round(avgScore * 100)}%` },
                        { label: "Passing (≥70%)", value: submissions.filter(s => s.score >= 0.70).length },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-white rounded-2xl border border-stone-100 p-5 fade-up fade-up-delay-${i + 1}`}>
                            <div className="text-2xl font-semibold text-stone-900">{stat.value}</div>
                            <div className="text-xs text-stone-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Submissions table */}
                {submissions.length === 0 ? (
                    <div className="text-center py-16 text-stone-400 bg-white rounded-2xl border border-stone-100">
                        <div className="text-4xl mb-3">📭</div>
                        <p>No submissions yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                            {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
                        </h2>
                        {submissions.map((s) => (
                            <div key={s.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <span className="text-sm font-medium text-stone-900">
                                            {s.student?.name || `Student #${s.student_id}`}
                                        </span>
                                        <span className="text-xs text-stone-400 ml-2">
                                            {new Date(s.submitted_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-lg border ${getScoreStyle(s.score)}`}>
                                        {Math.round(s.score * 100)}%
                                    </span>
                                </div>
                                <p className="text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3 leading-relaxed">
                                    {s.answer_text}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}