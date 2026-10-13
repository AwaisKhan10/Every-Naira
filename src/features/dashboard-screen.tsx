"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell";
import { Badge, Card, Td, Th, TableFrame } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { formatNgn, formatPercentFromRatio } from "@/lib/money";
import { paymentStatus } from "@/lib/orders";
import { chartSeries, lowStock, selectMetrics, topProducts, byWorkspace } from "@/lib/selectors";
import { DEMO_ANCHOR } from "@/lib/seed";
import { useDemoStore } from "@/lib/store";
import type { RangeKey } from "@/lib/types";

const TrendChart = dynamic(() => import("@/components/trend-chart").then((mod) => mod.TrendChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-md bg-surface-2" />,
});

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "all", label: "All sample dates" },
];

export function DashboardScreen() {
  const data = useDemoStore((state) => state.data);
  const [range, setRange] = useState<RangeKey>("all");
  const anchor = DEMO_ANCHOR;
  const metrics = useMemo(() => selectMetrics(data, data.activeWorkspaceId, range, anchor), [data, range, anchor]);
  const series = useMemo(() => chartSeries(data, data.activeWorkspaceId, range, anchor), [data, range, anchor]);
  const products = useMemo(() => topProducts(data, data.activeWorkspaceId, range, anchor).slice(0, 5), [data, range, anchor]);
  const lows = lowStock(data, data.activeWorkspaceId);
  const orders = byWorkspace(data.orders, data.activeWorkspaceId).filter((order) => order.createdAt <= anchor).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const activity = byWorkspace(data.activity, data.activeWorkspaceId).slice(0, 5);
  const customers = byWorkspace(data.customers, data.activeWorkspaceId);

  const cards = [
    ["Sales", formatNgn(metrics.salesKobo), "Orders in the selected range, after refunds"],
    ["Costs", formatNgn(metrics.operatingCostKobo), "Cost of goods, delivery cost, and expenses"],
    ["Estimated profit", formatNgn(metrics.estimatedProfitKobo), "Sales minus those costs"],
    ["Gross margin", formatPercentFromRatio(metrics.grossProfitKobo, metrics.grossBaseKobo), "Merchandise profit, before operating expenses"],
    ["Outstanding", formatNgn(metrics.outstandingKobo), "Current open balances, not limited to the range"],
    ["Inventory value", formatNgn(metrics.inventoryValueKobo), "On-hand quantity times current unit cost"],
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Figures are calculated from the sample orders, expenses, and stock movements in this workspace. Adaeze Collective is demonstration data."
        actions={
          <div className="flex rounded-md border border-line bg-surface p-1" role="group" aria-label="Date range">
            {RANGES.map((item) => (
              <button key={item.id} type="button" onClick={() => setRange(item.id)} className={`h-8 rounded px-2.5 text-xs ${range === item.id ? "bg-accent text-accent-ink" : "text-muted"}`} aria-pressed={range === item.id}>
                {item.label}
              </button>
            ))}
          </div>
        }
      />
      {metrics.orderCount === 0 && metrics.expenseKobo === 0 ? (
        <Card className="mb-4 px-4 py-3 text-sm text-muted">This workspace has no orders in the selected range. Add a product or switch back to Adaeze Collective.</Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, hint]) => (
          <Card key={label} className="px-4 py-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-medium">Sales</h2>
          <TrendChart points={series} metric="salesKobo" />
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-medium">Estimated profit</h2>
          <p className="text-xs text-muted">Sales minus cost of goods, delivery cost, and expenses dated that day.</p>
          <TrendChart points={series} metric="profitKobo" />
        </Card>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent orders</h2>
            <Link href="/orders" className="text-xs text-accent">View orders</Link>
          </div>
          <TableFrame>
            <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></thead>
            <tbody>
              {orders.map((order) => {
                const customer = customers.find((item) => item.id === order.customerId);
                const total = order.lines.reduce((sum, line) => sum + line.qty * line.unitPriceKobo - line.discountKobo, 0) - order.discountKobo + order.deliveryFeeKobo;
                return (
                  <tr key={order.id}>
                    <Td><Link href={`/orders/${order.id}`} className="font-medium">{order.number}</Link><div className="text-xs text-muted">{formatDate(order.createdAt)}</div></Td>
                    <Td>{customer?.name ?? "Customer"}</Td>
                    <Td><Badge tone={paymentStatus(order) === "paid" ? "good" : paymentStatus(order) === "partial" ? "warn" : "neutral"}>{paymentStatus(order)} · {order.fulfilment}</Badge></Td>
                    <Td className="text-right tabular-nums">{formatNgn(total)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableFrame>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-medium">Quick actions</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-2" href="/orders/new">Create an order</Link>
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-2" href="/products">Add a product</Link>
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-2" href="/inventory">Adjust stock</Link>
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-2" href="/pricing-studio">Open pricing</Link>
          </div>
          <h2 className="mt-5 text-sm font-medium">Low stock</h2>
          <ul className="mt-2 grid gap-2 text-sm">
            {lows.length === 0 ? <li className="text-muted">Nothing is at or below the threshold.</li> : lows.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-2"><span>{item.productName} · {item.variantName}</span><span className="tabular-nums text-warn">{item.stock}</span></li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium">Top products in range</h2>
          {products.length === 0 ? <p className="text-sm text-muted">No product sales in this range.</p> : (
            <ul className="grid gap-2 text-sm">
              {products.map((product) => (
                <li key={product.productId} className="flex items-center justify-between gap-3">
                  <span>{product.name}<span className="ml-2 text-xs text-muted">{product.qty} sold</span></span>
                  <span className="tabular-nums">{formatNgn(product.revenueKobo)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium">Recent activity</h2>
          <ul className="grid gap-3 text-sm">
            {activity.map((item) => (
              <li key={item.id}><p>{item.message}</p><p className="text-xs text-muted">{formatDate(item.at)}</p></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
