import type { Metadata } from "next";
import { CostingScreen } from "@/features/costing-screen";

export const metadata: Metadata = { title: "True cost · Every Naira Has a Job" };

export default function Page() {
  return <CostingScreen />;
}
