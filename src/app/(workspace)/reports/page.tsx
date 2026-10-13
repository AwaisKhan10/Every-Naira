import type { Metadata } from "next";
import { ReportsScreen } from "@/features/plan-screens";

export const metadata: Metadata = { title: "Reports · Every Naira Has a Job" };

export default function Page() {
  return <ReportsScreen />;
}
