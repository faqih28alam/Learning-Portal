"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const icons: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
};

const styles: Record<ToastType, string> = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function Toast({ message, type = "info", duration = 3500, onClose }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // wait for fade-out
        }, duration);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border
                  shadow-lg text-sm font-medium max-w-sm transition-all duration-300
                  ${styles[type]}
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
            <span>{icons[type]}</span>
            <span>{message}</span>
            <button
                onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
                className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
            >
                ×
            </button>
        </div>
    );
}

// Hook for easy toast management
export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const show = (message: string, type: ToastType = "info") => {
        setToast({ message, type });
    };

    const hide = () => setToast(null);

    const ToastEl = toast ? (
        <Toast message={toast.message} type={toast.type} onClose={hide} />
    ) : null;

    return { show, ToastEl };
}