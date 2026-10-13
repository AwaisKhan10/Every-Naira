"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSeed } from "@/lib/seed";
import type { DemoData } from "@/lib/types";
import type { DomainResult } from "@/lib/types";

export interface ToastItem {
  id: string;
  message: string;
  tone: "ok" | "err";
}

interface DemoStore {
  data: DemoData;
  hydrated: boolean;
  toasts: ToastItem[];
  setHydrated: (value: boolean) => void;
  dismissToast: (id: string) => void;
  apply: (result: DomainResult | ((data: DemoData) => DomainResult)) => boolean;
  reset: () => void;
}

function isDemoData(value: unknown): value is DemoData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DemoData>;
  return data.version === 1 && Array.isArray(data.products) && Array.isArray(data.orders) && Array.isArray(data.workspaces);
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      data: createSeed(),
      hydrated: false,
      toasts: [],
      setHydrated: (value) => set({ hydrated: value }),
      dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
      apply: (resultOrRecipe) => {
        const result = typeof resultOrRecipe === "function" ? resultOrRecipe(get().data) : resultOrRecipe;
        const id = `toast_${Date.now()}`;
        if (!result.ok) {
          set({ toasts: [...get().toasts, { id, message: result.error, tone: "err" }] });
          return false;
        }
        set({ data: result.data, toasts: [...get().toasts, { id, message: result.message, tone: "ok" }] });
        return true;
      },
      reset: () => {
        set({ data: createSeed(), toasts: [{ id: `toast_${Date.now()}`, message: "Demonstration data reset. Browser storage was replaced with the sample business.", tone: "ok" }] });
      },
    }),
    {
      name: "enj-demo-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : localStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({ data: state.data }),
      merge: (persisted, current) => {
        const stored = persisted as { data?: unknown } | undefined;
        if (!stored || !isDemoData(stored.data)) return current;
        return { ...current, data: stored.data };
      },
      onRehydrateStorage: () => (state, error) => {
        state?.setHydrated(true);
        if (error) state?.reset();
      },
    },
  ),
);

export function useWorkspace() {
  const data = useDemoStore((state) => state.data);
  const workspace = data.workspaces.find((item) => item.id === data.activeWorkspaceId) ?? data.workspaces[0];
  return { data, workspace };
}
