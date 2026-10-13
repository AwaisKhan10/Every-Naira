import type { Metadata } from "next";
import { InventoryScreen } from "@/features/inventory-screen";

export const metadata: Metadata = { title: "Inventory · Every Naira Has a Job" };

export default function Page() {
  return <InventoryScreen />;
}
