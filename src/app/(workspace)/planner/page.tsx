import type { Metadata } from "next";
import { PlannerScreen } from "@/features/plan-screens";

export const metadata: Metadata = { title: "Planner · Every Naira Has a Job" };

export default function Page() {
  return <PlannerScreen />;
}
