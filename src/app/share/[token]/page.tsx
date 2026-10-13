"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DocumentView } from "@/features/document-screen";
import { useDemoStore } from "@/lib/store";

export default function SharePage() {
  return (
    <Suspense fallback={<main className="px-4 py-16 text-sm">Loading preview…</main>}>
      <ShareBody />
    </Suspense>
  );
}

function ShareBody() {
  const params = useParams<{ token: string }>();
  const data = useDemoStore((state) => state.data);
  const share = data.shares.find((item) => item.token === params.token);
  if (!share) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Preview not on this browser</h1>
        <p className="mt-2 text-sm text-muted">Share previews are stored only in this browser’s demonstration data. This is not a secure public link.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent">Back to the site</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="no-print mb-4 text-sm text-muted">Local demonstration preview. It is not a secure share and it will not open on another device.</p>
      <DocumentView kind={share.kind} recordId={share.recordId} />
    </main>
  );
}
