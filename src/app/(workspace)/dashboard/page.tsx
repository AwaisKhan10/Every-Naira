import type { Metadata } from "next";
import { DashboardScreen } from "@/features/dashboard-screen";

export const metadata: Metadata = { title: "Dashboard · Every Naira Has a Job" };

export default function Page() {
  return <DashboardScreen />;
}
