import type { Metadata } from "next";
import { CustomerDetailScreen } from "@/features/customers-screen";

export const metadata: Metadata = { title: "Customer · Every Naira Has a Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailScreen customerId={id} />;
}