import type { Metadata } from "next";
import { OrderDetailScreen } from "@/features/orders-screen";

export const metadata: Metadata = { title: "Order · Every Naira Has a Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailScreen orderId={id} />;
}
