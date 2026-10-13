import type { Metadata } from "next";
import { CheckoutScreen } from "@/features/system-screens";

export const metadata: Metadata = { title: "Simulated failure · Every Naira Has a Job" };

export default function Page() {
  return <CheckoutScreen outcome="failed" />;
}
