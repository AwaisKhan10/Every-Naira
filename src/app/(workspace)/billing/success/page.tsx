import type { Metadata } from "next";
import { CheckoutScreen } from "@/features/system-screens";

export const metadata: Metadata = { title: "Simulated success · Every Naira Has a Job" };

export default function Page() {
  return <CheckoutScreen outcome="success" />;
}
