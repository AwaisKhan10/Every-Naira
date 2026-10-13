import type { Metadata } from "next";
import { OrdersScreen } from "@/features/orders-screen";

export const metadata: Metadata = { title: "Orders · Every Naira Has a Job" };

export default function Page() {
  return <OrdersScreen />;
}
