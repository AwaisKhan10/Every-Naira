import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "How it works · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="How it works" lede="Four steps, shown with the sample business Adaeze Collective.">
      <p>1. Add a product and its variants. Physical items can carry an opening quantity.</p>
      <p>2. Enter a purchase price, a sample exchange rate, freight, and duty. The unit landed cost is calculated in front of you.</p>
      <p>3. Set a selling price from a target margin, or test a discount and illustrative marketplace fees.</p>
      <p>4. Create an order. Stock falls, the balance stays open until a simulated payment is recorded, and the dashboard uses those same records.</p>
    </SimplePage>
  );
}
