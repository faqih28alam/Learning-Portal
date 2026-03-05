"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI, Role } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" as Role });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authAPI.register(form);
            router.push("/login?registered=1");
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
            <div className="w-full max-w-sm fade-up">
                <div className="font-display text-2xl text-stone-900 mb-1">
                    Essay<span className="text-blue-600">Score</span>
                </div>
                <h2 className="font-display text-3xl text-stone-900 mb-1 mt-6">Create account</h2>
                <p className="text-stone-500 mb-8 text-sm">Get started for free</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                            Full Name
                        </label>
                        <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="Budi Santoso"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                            minLength={6}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="Min. 6 characters"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wide">
                            I am a…
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["student", "teacher"] as Role[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setForm({ ...form, role: r })}
                                    className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all
                    ${form.role === r
                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                                        }`}
                                >
                                    {r === "student" ? "🎓 Student" : "📚 Teacher"}
                                </button>
                            ))}
                        </div>
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
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p className="text-center text-sm text-stone-500 mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}