"use client";

import { useEffect, useState } from "react";

interface ScoreBadgeProps {
    score: number; // 0.0 – 1.0
}

const getColor = (score: number) => {
    if (score >= 0.85) return { stroke: "#16a34a", text: "text-green-600", label: "Excellent", bg: "bg-green-50" };
    if (score >= 0.70) return { stroke: "#2563eb", text: "text-blue-600", label: "Good", bg: "bg-blue-50" };
    if (score >= 0.50) return { stroke: "#d97706", text: "text-amber-600", label: "Fair", bg: "bg-amber-50" };
    return { stroke: "#dc2626", text: "text-red-600", label: "Poor", bg: "bg-red-50" };
};

export default function ScoreBadge({ score }: ScoreBadgeProps) {
    const [animated, setAnimated] = useState(false);
    const { stroke, text, label, bg } = getColor(score);

    const radius = 45;
    const circumference = 2 * Math.PI * radius; // ~283
    const offset = circumference - (score * circumference);

    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`flex flex-col items-center gap-3 p-8 rounded-2xl ${bg} border border-stone-200`}>
            <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Track */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="8" />
                    {/* Progress */}
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={animated ? offset : circumference}
                        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-semibold ${text}`}>
                        {Math.round(score * 100)}
                    </span>
                    <span className="text-xs text-stone-400 tracking-wide">/ 100</span>
                </div>
            </div>

            <div className={`text-sm font-semibold ${text} tracking-wide uppercase`}>{label}</div>
            <p className="text-xs text-stone-500 text-center max-w-xs">
                {score >= 0.85 && "Your answer closely matches the key answer — great understanding!"}
                {score >= 0.70 && score < 0.85 && "Your answer captures the main ideas well."}
                {score >= 0.50 && score < 0.70 && "Your answer is partially correct. Review the topic further."}
                {score < 0.50 && "Your answer needs improvement. Try to include more key concepts."}
            </p>
        </div>
    );
}