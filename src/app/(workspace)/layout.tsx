import { Suspense } from "react";
import { AppShell } from "@/components/shell";

export const instant = false;

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
