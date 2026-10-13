import type { Metadata } from "next";
import { DevelopmentScreen } from "@/features/development-screen";

export const metadata: Metadata = { title: "Development · Every Naira Has a Job" };

export default function Page() {
  return <DevelopmentScreen />;
}
