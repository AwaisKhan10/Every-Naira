import type { Metadata } from "next";
import { PricingScreen } from "@/features/pricing-screen";

export const metadata: Metadata = { title: "Pricing studio · Every Naira Has a Job" };

export default function Page() {
  return <PricingScreen />;
}
