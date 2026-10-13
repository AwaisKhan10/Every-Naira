import { addDays } from "@/lib/format";
import { stockOf } from "@/lib/inventory";
import { orderTotals } from "@/lib/orders";
import { purchaseLanded } from "@/lib/pricing";
import type { DemoData, Order, RangeKey } from "@/lib/types";

export function byWorkspace<T extends { workspaceId: string }>(rows: T[], workspaceId: string): T[] {
  return rows.filter((row) => row.workspaceId === workspaceId);
}

export function rangeBounds(range: RangeKey, anchor: string): { start: string | null; end: string } {
  if (range === "all") return { start: null, end: anchor };
  const days = range === "7d" ? 6 : range === "30d" ? 29 : 89;
  return { start: addDays(anchor, -days), end: anchor };
}

export function inRange(date: string, start: string | null, end: string): boolean {
  const day = date.slice(0, 10);
  if (day > end) return false;
  if (start && day < start) return false;
  return true;
}

export interface PeriodMetrics {
  salesKobo: number;
  cogsKobo: number;
  deliveryFeeKobo: number;
  deliveryCostKobo: number;
  expenseKobo: number;
  operatingCostKobo: number;
  estimatedProfitKobo: number;
  grossProfitKobo: number;
  grossBaseKobo: number;
  outstandingKobo: number;
  inventoryValueKobo: number;
  lowStockCount: number;
  orderCount: number;
}

export function selectMetrics(data: DemoData, workspaceId: string, range: RangeKey, anchor: string): PeriodMetrics {
  const bounds = rangeBounds(range, anchor);
  const orders = byWorkspace(data.orders, workspaceId).filter((order) => inRange(order.createdAt, bounds.start, bounds.end));
  let salesKobo = 0;
  let cogsKobo = 0;
  let deliveryFeeKobo = 0;
  let deliveryCostKobo = 0;
  let grossProfitKobo = 0;
  let grossBaseKobo = 0;
  let orderCount = 0;
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    orderCount += 1;
    const totals = orderTotals(order);
    const recognized = totals.totalKobo - totals.refundedKobo;
    const recognizedCogs = totals.cogsKobo - totals.restockedCogsKobo;
    salesKobo += recognized;
    cogsKobo += recognizedCogs;
    deliveryFeeKobo += totals.deliveryFeeKobo;
    deliveryCostKobo += totals.deliveryCostKobo;
    const merchandiseAfterDiscount = totals.totalKobo - totals.deliveryFeeKobo;
    grossBaseKobo += merchandiseAfterDiscount;
    grossProfitKobo += merchandiseAfterDiscount - recognizedCogs;
  }
  const expenseKobo = byWorkspace(data.expenses, workspaceId)
    .filter((expense) => inRange(expense.at, bounds.start, bounds.end))
    .reduce((sum, expense) => sum + expense.amountKobo, 0);
  const operatingCostKobo = cogsKobo + deliveryCostKobo + expenseKobo;
  return {
    salesKobo,
    cogsKobo,
    deliveryFeeKobo,
    deliveryCostKobo,
    expenseKobo,
    operatingCostKobo,
    estimatedProfitKobo: salesKobo - operatingCostKobo,
    grossProfitKobo,
    grossBaseKobo,
    outstandingKobo: currentOutstanding(data, workspaceId),
    inventoryValueKobo: inventoryValue(data, workspaceId),
    lowStockCount: lowStock(data, workspaceId).length,
    orderCount,
  };
}

export function currentOutstanding(data: DemoData, workspaceId: string): number {
  return byWorkspace(data.orders, workspaceId).reduce((sum, order) => {
    if (order.status === "cancelled") return sum;
    return sum + orderTotals(order).outstandingKobo;
  }, 0);
}

export function inventoryValue(data: DemoData, workspaceId: string): number {
  const movements = byWorkspace(data.movements, workspaceId);
  return byWorkspace(data.products, workspaceId).reduce((sum, product) => {
    if (!product.trackStock) return sum;
    return sum + product.variants.reduce((variantSum, variant) => variantSum + stockOf(movements, variant.id) * variant.costKobo, 0);
  }, 0);
}

export interface LowStockItem {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  stock: number;
  threshold: number;
}

export function lowStock(data: DemoData, workspaceId: string): LowStockItem[] {
  const workspace = data.workspaces.find((item) => item.id === workspaceId);
  const threshold = workspace?.lowStockAt ?? 3;
  const movements = byWorkspace(data.movements, workspaceId);
  const items: LowStockItem[] = [];
  for (const product of byWorkspace(data.products, workspaceId)) {
    if (!product.trackStock || product.status === "archived") continue;
    for (const variant of product.variants) {
      const stock = stockOf(movements, variant.id);
      if (stock <= threshold) {
        items.push({ productId: product.id, productName: product.name, variantId: variant.id, variantName: variant.name, sku: variant.sku, stock, threshold });
      }
    }
  }
  return items.sort((a, b) => a.stock - b.stock);
}

export interface ChartPoint {
  date: string;
  salesKobo: number;
  profitKobo: number;
}

export function chartSeries(data: DemoData, workspaceId: string, range: RangeKey, anchor: string): ChartPoint[] {
  const bounds = rangeBounds(range, anchor);
  const orders = byWorkspace(data.orders, workspaceId).filter((order) => order.status !== "cancelled" && inRange(order.createdAt, bounds.start, bounds.end));
  const expenses = byWorkspace(data.expenses, workspaceId).filter((expense) => inRange(expense.at, bounds.start, bounds.end));
  const dates = new Set<string>();
  orders.forEach((order) => dates.add(order.createdAt.slice(0, 10)));
  expenses.forEach((expense) => dates.add(expense.at.slice(0, 10)));
  if (bounds.start) {
    let cursor = bounds.start;
    let guard = 0;
    while (cursor <= bounds.end && guard < 120) {
      dates.add(cursor);
      cursor = addDays(cursor, 1);
      guard += 1;
    }
  }
  return [...dates].sort().map((date) => {
    const dayOrders = orders.filter((order) => order.createdAt.slice(0, 10) === date);
    const salesKobo = dayOrders.reduce((sum, order) => {
      const totals = orderTotals(order);
      return sum + totals.totalKobo - totals.refundedKobo;
    }, 0);
    const cogsKobo = dayOrders.reduce((sum, order) => sum + orderTotals(order).cogsKobo - orderTotals(order).restockedCogsKobo, 0);
    const deliveryCostKobo = dayOrders.reduce((sum, order) => sum + order.deliveryCostKobo, 0);
    const expenseKobo = expenses.filter((expense) => expense.at.slice(0, 10) === date).reduce((sum, expense) => sum + expense.amountKobo, 0);
    return { date, salesKobo, profitKobo: salesKobo - cogsKobo - deliveryCostKobo - expenseKobo };
  });
}

export interface ProductPerformance {
  productId: string;
  name: string;
  qty: number;
  revenueKobo: number;
}

export function topProducts(data: DemoData, workspaceId: string, range: RangeKey, anchor: string): ProductPerformance[] {
  const bounds = rangeBounds(range, anchor);
  const map = new Map<string, ProductPerformance>();
  for (const order of byWorkspace(data.orders, workspaceId)) {
    if (order.status === "cancelled" || !inRange(order.createdAt, bounds.start, bounds.end)) continue;
    for (const line of order.lines) {
      const current = map.get(line.productId) ?? { productId: line.productId, name: line.name, qty: 0, revenueKobo: 0 };
      current.qty += line.qty;
      current.revenueKobo += line.qty * line.unitPriceKobo - line.discountKobo;
      map.set(line.productId, current);
    }
  }
  return [...map.values()].sort((a, b) => b.revenueKobo - a.revenueKobo);
}

export function customerBalance(data: DemoData, customerId: string): number {
  return data.orders.reduce((sum, order) => {
    if (order.customerId !== customerId || order.status === "cancelled") return sum;
    return sum + orderTotals(order).outstandingKobo;
  }, 0);
}

export function supplierOutstanding(data: DemoData, supplierId: string): number {
  return data.purchases.reduce((sum, purchase) => {
    if (purchase.supplierId !== supplierId || purchase.status === "cancelled") return sum;
    const landed = purchaseLanded(purchase);
    if ("error" in landed) return sum;
    return sum + Math.max(0, landed.totalKobo - purchase.paidKobo);
  }, 0);
}

export function ordersForCustomer(data: DemoData, customerId: string): Order[] {
  return data.orders.filter((order) => order.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
