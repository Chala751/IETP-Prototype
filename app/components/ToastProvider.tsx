"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

type ToastTone = "info" | "success" | "warning";

type ToastItem = {
    id: string;
    message: string;
    tone: ToastTone;
};

type ToastContextValue = {
    pushToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
    info: "border-slate-200/80 bg-white/90 text-slate-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timeouts = useRef(new Map<string, number>());

    const removeToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        const timeout = timeouts.current.get(id);
        if (timeout) {
            window.clearTimeout(timeout);
            timeouts.current.delete(id);
        }
    }, []);

    const pushToast = useCallback((message: string, tone: ToastTone = "info") => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((current) => [...current, { id, message, tone }]);

        const timeout = window.setTimeout(() => {
            removeToast(id);
        }, 3200);

        timeouts.current.set(id, timeout);
    }, [removeToast]);

    const value = useMemo(() => ({ pushToast }), [pushToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-6 top-24 z-50 flex w-[min(90vw,360px)] flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] backdrop-blur ${toneStyles[toast.tone]}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
