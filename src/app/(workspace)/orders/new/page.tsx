import type { Metadata } from "next";
import { NewOrderScreen } from "@/features/orders-screen";

export const metadata: Metadata = { title: "New order · Every Naira Has a Job" };

export default function Page() {
  return <NewOrderScreen />;
}
