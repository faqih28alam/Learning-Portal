"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { questionsAPI, studentAPI, Question, Submission } from "@/lib/api";
import { getUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import {
    QuestionCardSkeleton,
} from "@/components/Skeleton";

export default function QuestionsPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const user = getUser();

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        if (user.role === "teacher") { router.push("/dashboard"); return; }

        Promise.all([
            questionsAPI.list(),
            studentAPI.mySubmissions(),
        ]).then(([qRes, sRes]) => {
            setQuestions(qRes.data.questions || []);
            setSubmissions(sRes.data.submissions || []);
        }).finally(() => setLoading(false));
    }, []);

    // Map question_id → best score
    const scoreMap = submissions.reduce((acc, s) => {
        if (!acc[s.question_id] || s.score > acc[s.question_id]) {
            acc[s.question_id] = s.score;
        }
        return acc;
    }, {} as Record<number, number>);

    const getScoreColor = (score: number) => {
        if (score >= 0.85) return "text-green-600 bg-green-50";
        if (score >= 0.70) return "text-blue-600 bg-blue-50";
        if (score >= 0.50) return "text-amber-600 bg-amber-50";
        return "text-red-600 bg-red-50";
    };

    if (loading) return (
        <div className="min-h-screen bg-stone-50">
            <NavBar />
            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <div className="h-10 w-48 bg-stone-200 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <QuestionCardSkeleton key={i} />)}
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50">
            <NavBar />

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8 fade-up">
                    <h1 className="font-display text-4xl text-stone-900 mb-1">Questions</h1>
                    <p className="text-stone-500">
                        {questions.length} question{questions.length !== 1 ? "s" : ""} available
                    </p>
                </div>

                {questions.length === 0 ? (
                    <div className="text-center py-20 text-stone-400 fade-up-delay-1">
                        <div className="text-5xl mb-4">📭</div>
                        <p>No questions available yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q, i) => {
                            const score = scoreMap[q.id];
                            const attempted = score !== undefined;
                            return (
                                <div
                                    key={q.id}
                                    className={`fade-up fade-up-delay-${Math.min(i + 1, 3)} bg-white rounded-2xl border border-stone-100
                               shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer p-6`}
                                    onClick={() => router.push(`/questions/${q.id}`)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-stone-400 font-mono">#{q.id}</span>
                                                {attempted && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScoreColor(score)}`}>
                                                        Best: {Math.round(score * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-stone-900 truncate">{q.title}</h3>
                                            <p className="text-sm text-stone-500 mt-1 line-clamp-2">{q.body}</p>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                        ${attempted ? "bg-green-50" : "bg-stone-100"}`}>
                                                {attempted ? "✅" : "📝"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}