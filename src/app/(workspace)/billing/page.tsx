import type { Metadata } from "next";
import { BillingScreen } from "@/features/system-screens";

export const metadata: Metadata = { title: "Billing · Every Naira Has a Job" };

export default function Page() {
  return <BillingScreen />;
}
