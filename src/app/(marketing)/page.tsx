import type { Metadata } from "next";
import { HomeScreen } from "@/features/marketing";

export const metadata: Metadata = { title: "Every Naira Has a Job" };

export default function Page() {
  return <HomeScreen />;
}
