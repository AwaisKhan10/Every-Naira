import type { Metadata } from "next";
import { CustomersScreen } from "@/features/customers-screen";

export const metadata: Metadata = { title: "Customers · Every Naira Has a Job" };

export default function Page() {
  return <CustomersScreen />;
}
