import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "Help · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="Help" lede="How to present the demo.">
      <p>Open Dashboard to show the sample month. Change the date range and watch sales move.</p>
      <p>Receive the remaining sandals from PO-2402, then create an order for a new customer.</p>
      <p>Switch to Northside Provisions to show an empty workspace, then switch back.</p>
      <p>Reset demo data from the profile menu if the sample gets too far from the original story.</p>
    </SimplePage>
  );
}
