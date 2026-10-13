import type { Metadata } from "next";
import { SuppliersScreen } from "@/features/supplier-screens";

export const metadata: Metadata = { title: "Suppliers · Every Naira Has a Job" };

export default function Page() {
  return <SuppliersScreen />;
}
