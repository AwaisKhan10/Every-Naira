import type { Metadata } from "next";
import { ImportScreen } from "@/features/import-screen";

export const metadata: Metadata = { title: "CSV import · Every Naira Has a Job" };

export default function Page() {
  return <ImportScreen />;
}
