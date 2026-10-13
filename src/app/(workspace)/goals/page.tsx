import type { Metadata } from "next";
import { GoalsScreen } from "@/features/plan-screens";

export const metadata: Metadata = { title: "Goals · Every Naira Has a Job" };

export default function Page() {
  return <GoalsScreen />;
}
