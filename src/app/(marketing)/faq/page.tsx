import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "FAQ · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="FAQ" lede="Straight answers about this demonstration.">
      <p><strong>Is my data saved?</strong> Only in this browser. Use Reset demo data in the profile menu to restore the sample business.</p>
      <p><strong>Are Jumia and Konga fees current?</strong> No. They are labelled sample inputs.</p>
      <p><strong>Can I send WhatsApp or take a card payment?</strong> No. Those flows stay inside the demo and say so.</p>
      <p><strong>Is the admin lock real security?</strong> No. It is a role switch for the presentation.</p>
    </SimplePage>
  );
}
