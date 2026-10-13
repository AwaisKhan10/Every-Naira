import type { Metadata } from "next";
import { DevelopmentEditor } from "@/features/development-screen";

export const metadata: Metadata = { title: "Development record · Every Naira Has a Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DevelopmentEditor projectId={id} />;
}
