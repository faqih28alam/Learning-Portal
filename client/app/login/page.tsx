"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { setSession } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await authAPI.login(form);
            const { token, user } = res.data;
            setSession(token, user);

            // Role-based redirect
            router.push(user.role === "teacher" ? "/dashboard" : "/questions");
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex w-1/2 bg-stone-900 flex-col justify-between p-12">
                <div className="font-display text-2xl text-white">
                    Essay<span className="text-blue-400">Score</span>
                </div>
                <div>
                    <h1 className="font-display text-5xl text-white leading-tight mb-6">
                        Grade essays<br />
                        <em className="text-blue-400">instantly.</em>
                    </h1>
                    <p className="text-stone-400 text-lg max-w-sm">
                        AI-powered semantic scoring that understands meaning,
                        not just keywords.
                    </p>
                </div>
                <div className="flex gap-6 text-stone-500 text-sm">
                    <span>🧠 MiniLM-L6-v2</span>
                    <span>⚡ &lt;100ms scoring</span>
                    <span>🎯 Semantic similarity</span>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm fade-up">
                    <h2 className="font-display text-3xl text-stone-900 mb-1">Welcome back</h2>
                    <p className="text-stone-500 mb-8 text-sm">Sign in to your account</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-medium
                         hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-stone-500 mt-6">
                        No account?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}