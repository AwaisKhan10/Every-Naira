import type { Metadata } from "next";
import { DocumentView } from "@/features/document-screen";

export const metadata: Metadata = { title: "Document · Every Naira Has a Job" };

export default async function Page({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  return <DocumentView kind={kind} recordId={id} />;
}
