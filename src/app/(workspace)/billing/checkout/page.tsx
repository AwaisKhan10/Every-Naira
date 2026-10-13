import type { Metadata } from "next";
import { CheckoutScreen } from "@/features/system-screens";

export const metadata: Metadata = { title: "Checkout preview · Every Naira Has a Job" };

export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return <CheckoutScreen planId={plan} />;
}
