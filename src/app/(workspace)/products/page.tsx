import type { Metadata } from "next";
import { ProductsScreen } from "@/features/products-screen";

export const metadata: Metadata = { title: "Products · Every Naira Has a Job" };

export default function Page() {
  return <ProductsScreen />;
}
