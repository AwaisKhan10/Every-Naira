import type { Metadata } from "next";
import { DevelopmentEditor } from "@/features/development-screen";

export const metadata: Metadata = { title: "New development record · Every Naira Has a Job" };

export default function Page() {
  return <DevelopmentEditor projectId={null} />;
}
