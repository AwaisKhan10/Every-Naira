import type { Metadata } from "next";
import { ProductDetailScreen } from "@/features/products-screen";

export const metadata: Metadata = { title: "Product · Every Naira Has a Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailScreen productId={id} />;
}
