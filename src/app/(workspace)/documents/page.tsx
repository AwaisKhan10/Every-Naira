import type { Metadata } from "next";
import { DocumentsScreen } from "@/features/document-screen";

export const metadata: Metadata = { title: "Documents · Every Naira Has a Job" };

export default function Page() {
  return <DocumentsScreen />;
}
