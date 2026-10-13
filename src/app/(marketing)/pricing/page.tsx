import type { Metadata } from "next";
import Link from "next/link";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "Pricing · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="Pricing" lede="Demonstration plan prices, not a live offer and not a quote.">
      <p>Starter ₦15,000, Growth ₦35,000, and Scale ₦75,000 per month are placeholders so the billing screens have something to show.</p>
      <p>The demo checkout never collects a card and never marks a subscription as genuinely active.</p>
      <p><Link className="text-accent" href="/get-started">Get started in the demo</Link> or <Link className="text-accent" href="/billing">open billing inside the workspace</Link>.</p>
    </SimplePage>
  );
}
