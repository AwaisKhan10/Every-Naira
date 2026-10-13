import type { Movement, Product } from "@/lib/types";

export function stockOf(movements: Movement[], variantId: string): number {
  return movements.reduce((sum, movement) => (movement.variantId === variantId ? sum + movement.qtyDelta : sum), 0);
}

export function productStock(product: Product, movements: Movement[]): number | null {
  if (!product.trackStock) return null;
  return product.variants.reduce((sum, variant) => sum + stockOf(movements, variant.id), 0);
}

export function findVariant(products: Product[], variantId: string): { product: Product; variant: Product["variants"][number] } | null {
  for (const product of products) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}
