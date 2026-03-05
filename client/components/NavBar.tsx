"use client";

import { useRouter } from "next/navigation";
import { getUser, clearSession } from "@/lib/auth";

export default function NavBar() {
    const router = useRouter();
    const user = getUser();

    const logout = () => {
        clearSession();
        router.push("/login");
    };

    const homeLink = user?.role === "teacher" ? "/dashboard" : "/questions";

    return (
        <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                <a href={homeLink} className="font-display text-xl text-stone-900 tracking-tight">
                    Essay<span className="text-blue-600">Score</span>
                </a>

                <div className="flex items-center gap-4">
                    {user && (
                        <>
                            <span className="text-sm text-stone-500">
                                {user.name}
                                <span className="ml-2 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full capitalize">
                                    {user.role}
                                </span>
                            </span>
                            <button
                                onClick={logout}
                                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                Sign out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}