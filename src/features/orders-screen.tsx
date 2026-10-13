"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shell";
import { Badge, Button, EmptyState, Field, SelectInput, TableFrame, Td, TextInput, Th } from "@/components/ui";
import { addPayment, addRefund, cancelOrder, createOrder, setFulfilment } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { formatNgn, parseNairaToKobo } from "@/lib/money";
import { orderTotals, paymentStatus } from "@/lib/orders";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { FulfilmentStatus } from "@/lib/types";

const lineSchema = z.object({
  variantId: z.string().min(1),
  qty: z.string().refine((value) => /^\d+$/.test(value) && Number(value) > 0, "Quantity must be at least 1."),
  price: z.string().refine((value) => parseNairaToKobo(value) !== null, "Enter a price."),
  discount: z.string().refine((value) => value === "" || parseNairaToKobo(value) !== null, "Enter a discount or leave it blank."),
});

const orderSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  discount: z.string(),
  deliveryFee: z.string(),
  deliveryCost: z.string(),
  lines: z.array(lineSchema).min(1),
});

type OrderValues = z.infer<typeof orderSchema>;

export function OrdersScreen() {
  const data = useDemoStore((state) => state.data);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const orders = useMemo(() => byWorkspace(data.orders, data.activeWorkspaceId).filter((order) => {
    const customer = data.customers.find((item) => item.id === order.customerId);
    const haystack = `${order.number} ${customer?.name ?? ""}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    if (status !== "all" && paymentStatus(order) !== status && order.fulfilment !== status) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data, query, status]);

  return (
    <div>
      <PageHeader title="Orders" description="Payments are simulated. Amounts are checked against the outstanding balance, and a repeated submission is rejected." actions={<Link href="/orders/new" className="inline-flex h-10 items-center rounded-md bg-accent px-3.5 text-sm text-accent-ink">Create order</Link>} />
      <div className="mb-3 grid gap-2 md:grid-cols-2">
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order number or customer" aria-label="Search orders" />
        <SelectInput value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter orders">
          <option value="all">All</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="packing">Packing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </SelectInput>
      </div>
      {orders.length === 0 ? <EmptyState title="No orders" body="Create an order from a customer and a product in this workspace." /> : (
        <TableFrame>
          <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Payment</Th><Th>Fulfilment</Th><Th className="text-right">Outstanding</Th></tr></thead>
          <tbody>
            {orders.map((order) => {
              const totals = orderTotals(order);
              const customer = data.customers.find((item) => item.id === order.customerId);
              return (
                <tr key={order.id}>
                  <Td><Link className="font-medium" href={`/orders/${order.id}`}>{order.number}</Link><div className="text-xs text-muted">{formatDate(order.createdAt)}</div></Td>
                  <Td>{customer?.name}</Td>
                  <Td><Badge tone={paymentStatus(order) === "paid" ? "good" : "warn"}>{paymentStatus(order)}</Badge></Td>
                  <Td className="capitalize">{order.fulfilment}</Td>
                  <Td className="text-right tabular-nums">{formatNgn(order.status === "cancelled" ? 0 : totals.outstandingKobo)}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableFrame>
      )}
    </div>
  );
}

export function NewOrderScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const router = useRouter();
  const customers = byWorkspace(data.customers, data.activeWorkspaceId);
  const variants = byWorkspace(data.products, data.activeWorkspaceId).filter((product) => product.status === "active").flatMap((product) => product.variants.map((variant) => ({ product, variant })));
  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { customerId: customers[0]?.id ?? "", discount: "0", deliveryFee: "0", deliveryCost: "0", lines: [{ variantId: variants[0]?.variant.id ?? "", qty: "1", price: variants[0] ? String(variants[0].variant.priceKobo / 100) : "0", discount: "0" }] },
  });
  const lines = useFieldArray({ control: form.control, name: "lines" });

  return (
    <div>
      <PageHeader title="Create order" description="Stock-tracked lines are checked against on-hand quantity. The cost on each line is snapshotted from the current unit cost." />
      <form className="grid max-w-3xl gap-3" onSubmit={form.handleSubmit((values) => {
        const result = createOrder(data, {
          id: uid("ord"),
          workspaceId: data.activeWorkspaceId,
          customerId: values.customerId,
          date: todayIso(),
          discountKobo: parseNairaToKobo(values.discount || "0") ?? 0,
          deliveryFeeKobo: parseNairaToKobo(values.deliveryFee || "0") ?? 0,
          deliveryCostKobo: parseNairaToKobo(values.deliveryCost || "0") ?? 0,
          historyId: uid("hist"),
          movementIds: values.lines.map(() => uid("mov")),
          lines: values.lines.map((line) => ({ id: uid("ln"), variantId: line.variantId, qty: Number(line.qty), unitPriceKobo: parseNairaToKobo(line.price) ?? 0, discountKobo: parseNairaToKobo(line.discount || "0") ?? 0 })),
        });
        if (apply(result) && result.ok) router.push(`/orders/${result.data.orders[0]?.id ?? ""}`);
      })}>
        <Field label="Customer" error={form.formState.errors.customerId?.message}>
          <SelectInput {...form.register("customerId")}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</SelectInput>
        </Field>
        {lines.fields.map((field, index) => (
          <div key={field.id} className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-4">
            <Field label="Product"><SelectInput {...form.register(`lines.${index}.variantId`)} onChange={(event) => {
              form.setValue(`lines.${index}.variantId`, event.target.value);
              const match = variants.find((item) => item.variant.id === event.target.value);
              if (match) form.setValue(`lines.${index}.price`, String(match.variant.priceKobo / 100));
            }}>{variants.map((item) => <option key={item.variant.id} value={item.variant.id}>{item.product.name} · {item.variant.name}</option>)}</SelectInput></Field>
            <Field label="Qty" error={form.formState.errors.lines?.[index]?.qty?.message}><TextInput {...form.register(`lines.${index}.qty`)} /></Field>
            <Field label="Price (₦)" error={form.formState.errors.lines?.[index]?.price?.message}><TextInput {...form.register(`lines.${index}.price`)} /></Field>
            <Field label="Discount (₦)"><TextInput {...form.register(`lines.${index}.discount`)} /></Field>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => lines.append({ variantId: variants[0]?.variant.id ?? "", qty: "1", price: variants[0] ? String(variants[0].variant.priceKobo / 100) : "0", discount: "0" })}>Add line</Button>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Order discount (₦)"><TextInput {...form.register("discount")} /></Field>
          <Field label="Delivery fee charged (₦)"><TextInput {...form.register("deliveryFee")} /></Field>
          <Field label="Actual delivery cost (₦)"><TextInput {...form.register("deliveryCost")} /></Field>
        </div>
        <p className="text-sm text-muted">The order total is checked when you submit, including discounts and both delivery amounts.</p>
        <Button type="submit">Create order</Button>
      </form>
    </div>
  );
}

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const order = data.orders.find((item) => item.id === orderId && item.workspaceId === data.activeWorkspaceId);
  const [amount, setAmount] = useState("");
  const [refund, setRefund] = useState("");
  const [restock, setRestock] = useState("0");
  const [variantId, setVariantId] = useState(order?.lines[0]?.variantId ?? "");
  const [key] = useState(() => uid("idem"));
  const [refundKey] = useState(() => uid("idem"));
  if (!order) return <EmptyState title="Order not in this workspace" body="It may belong to the other demonstration workspace." action={<Link href="/orders" className="text-accent">Back to orders</Link>} />;
  const totals = orderTotals(order);
  const customer = data.customers.find((item) => item.id === order.customerId);
  return (
    <div>
      <PageHeader title={order.number} description={`${customer?.name ?? "Customer"} · ${formatDate(order.createdAt)} · Simulated payments only`} actions={<Link href={`/documents/invoice/${order.id}`} className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm">Invoice</Link>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={paymentStatus(order) === "paid" ? "good" : "warn"}>{paymentStatus(order)}</Badge>
        <Badge>{order.fulfilment}</Badge>
        {order.status === "cancelled" ? <Badge tone="bad">cancelled</Badge> : null}
      </div>
      <TableFrame>
        <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Price</Th><Th className="text-right">Cost snapshot</Th></tr></thead>
        <tbody>
          {order.lines.map((line) => <tr key={line.id}><Td>{line.name} · {line.variantName}</Td><Td className="text-right">{line.qty}</Td><Td className="text-right tabular-nums">{formatNgn(line.unitPriceKobo)}</Td><Td className="text-right tabular-nums">{formatNgn(line.unitCostKobo)}</Td></tr>)}
        </tbody>
      </TableFrame>
      <dl className="mt-4 grid max-w-md gap-1 text-sm">
        <div className="flex justify-between"><dt>Merchandise</dt><dd className="tabular-nums">{formatNgn(totals.merchandiseKobo)}</dd></div>
        <div className="flex justify-between"><dt>Order discount</dt><dd className="tabular-nums">{formatNgn(order.discountKobo)}</dd></div>
        <div className="flex justify-between"><dt>Delivery fee charged</dt><dd className="tabular-nums">{formatNgn(order.deliveryFeeKobo)}</dd></div>
        <div className="flex justify-between"><dt>Actual delivery cost</dt><dd className="tabular-nums">{formatNgn(order.deliveryCostKobo)}</dd></div>
        <div className="flex justify-between font-medium"><dt>Total</dt><dd className="tabular-nums">{formatNgn(totals.totalKobo)}</dd></div>
        <div className="flex justify-between"><dt>Paid</dt><dd className="tabular-nums">{formatNgn(totals.netPaidKobo)}</dd></div>
        <div className="flex justify-between"><dt>Outstanding</dt><dd className="tabular-nums">{formatNgn(totals.outstandingKobo)}</dd></div>
      </dl>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form className="grid gap-2 rounded-lg border border-line bg-surface p-4" onSubmit={(event) => { event.preventDefault(); const parsed = parseNairaToKobo(amount); if (parsed === null) return; apply((current) => addPayment(current, { workspaceId: current.activeWorkspaceId, orderId: order.id, id: uid("pay"), amountKobo: parsed, method: "Transfer", date: todayIso(), note: "Simulated payment", idempotencyKey: key })); }}>
          <h2 className="text-sm font-medium">Record simulated payment</h2>
          <Field label="Amount (₦)" hint={`Outstanding ${formatNgn(totals.outstandingKobo)}. Submitting twice uses the same key and is rejected.`}><TextInput value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
          <div className="flex gap-2">
            <Button type="submit">Record payment</Button>
            <Button type="button" variant="secondary" onClick={() => { setAmount(String(totals.outstandingKobo / 100)); }}>Use full balance</Button>
          </div>
        </form>
        <form className="grid gap-2 rounded-lg border border-line bg-surface p-4" onSubmit={(event) => { event.preventDefault(); const parsed = parseNairaToKobo(refund); if (parsed === null) return; apply(addRefund(data, { workspaceId: data.activeWorkspaceId, orderId: order.id, id: uid("ref"), amountKobo: parsed, variantId: Number(restock) > 0 ? variantId : null, restockQty: Number(restock) || 0, date: todayIso(), note: "Simulated refund", idempotencyKey: refundKey, movementId: uid("mov") })); }}>
          <h2 className="text-sm font-medium">Record simulated refund</h2>
          <Field label="Amount (₦)"><TextInput value={refund} onChange={(event) => setRefund(event.target.value)} /></Field>
          <Field label="Restock quantity"><TextInput value={restock} onChange={(event) => setRestock(event.target.value)} /></Field>
          <Field label="Variant to restock"><SelectInput value={variantId} onChange={(event) => setVariantId(event.target.value)}>{order.lines.map((line) => <option key={line.variantId} value={line.variantId}>{line.name}</option>)}</SelectInput></Field>
          <Button type="submit" variant="secondary">Record refund</Button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["packing", "shipped", "delivered"] as FulfilmentStatus[]).map((step) => (
          <Button key={step} type="button" variant="secondary" onClick={() => apply(setFulfilment(data, { workspaceId: data.activeWorkspaceId, orderId: order.id, fulfilment: step, date: todayIso(), historyId: uid("hist") }))}>Mark {step}</Button>
        ))}
        <Button type="button" variant="danger" onClick={() => apply(cancelOrder(data, { workspaceId: data.activeWorkspaceId, orderId: order.id, date: todayIso(), historyId: uid("hist"), movementIds: order.lines.map(() => uid("mov")) }))}>Cancel order</Button>
      </div>
      <h2 className="mt-6 mb-2 text-sm font-medium">History</h2>
      <ul className="grid gap-2 text-sm">{order.history.map((item) => <li key={item.id}>{formatDate(item.at)} · {item.message}</li>)}</ul>
    </div>
  );
}
