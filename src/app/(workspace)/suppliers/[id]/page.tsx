import type { Metadata } from "next";
import { SupplierDetailScreen } from "@/features/supplier-screens";

export const metadata: Metadata = { title: "Supplier · Every Naira Has a Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierDetailScreen supplierId={id} />;
}
