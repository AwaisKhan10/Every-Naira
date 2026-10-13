import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "Features · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="Features" lede="What you can click through in this demonstration.">
      <p>Products and variants, suppliers, purchase batches, and landed cost.</p>
      <p>Pricing scenarios, bulk price preview, and editable sample fees for direct sales, Jumia, and Konga.</p>
      <p>Inventory movements, stocktake, receiving, and a barcode lookup that does not claim to use a scanner.</p>
      <p>Orders, partial payments, refunds, customers, invoices, receipts, packing slips, and statements.</p>
      <p>A product-development tech pack, message drafts, goals, a planner, reports, and CSV import.</p>
    </SimplePage>
  );
}
