"use client";

import { useEffect } from "react";
import { useDemoStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const dismiss = useDemoStore((state) => state.dismissToast);
  const toasts = useDemoStore((state) => state.toasts);

  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => {
      const oldest = toasts[0];
      if (oldest) dismiss(oldest.id);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [toasts, dismiss]);

  return (
    <>
      {children}
      <div className="no-print pointer-events-none fixed right-4 bottom-4 z-50 grid w-[min(360px,calc(100%-2rem))] gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto rounded-lg border px-3 py-2 text-left text-sm shadow-[var(--shadow)] ${toast.tone === "err" ? "border-danger/30 bg-danger-soft text-danger" : "border-line bg-surface text-ink"}`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </>
  );
}
