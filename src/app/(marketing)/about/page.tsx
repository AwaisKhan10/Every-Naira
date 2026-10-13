import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "About · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="About" lede="A product demonstration for sellers who need cost, price, and stock to agree with each other.">
      <p>Adaeze Collective, its customers, and its suppliers are fictional. Email addresses use example domains. Nothing on this site is a customer endorsement.</p>
      <p>The interface is a frontend demo. A production version would add accounts, a database, and real provider connections.</p>
    </SimplePage>
  );
}
