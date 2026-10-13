import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "Terms · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="Terms" lede="Demonstration copy, not a contract.">
      <p>The workspace is a presentation of proposed product behaviour. Calculations are illustrative and are not accounting, tax, or payout advice.</p>
      <p>Marketplace fees, plan prices, and exchange rates shown here are samples until a client supplies a real source.</p>
    </SimplePage>
  );
}
