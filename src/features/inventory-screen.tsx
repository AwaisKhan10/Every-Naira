"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, Field, SelectInput, TableFrame, Td, TextInput, Th } from "@/components/ui";
import { adjustStock, receivePurchase } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { stockOf } from "@/lib/inventory";
import { formatNgn } from "@/lib/money";
import { byWorkspace, lowStock } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";

export function InventoryScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const workspaceId = data.activeWorkspaceId;
  const movements = byWorkspace(data.movements, workspaceId);
  const rows = byWorkspace(data.products, workspaceId).flatMap((product) => product.trackStock ? product.variants.map((variant) => ({ product, variant, stock: stockOf(movements, variant.id) })) : []);
  const lows = lowStock(data, workspaceId);
  const [variantId, setVariantId] = useState(rows[0]?.variant.id ?? "");
  const [delta, setDelta] = useState("-1");
  const [counted, setCounted] = useState("0");
  const [note, setNote] = useState("");
  const [scan, setScan] = useState("");
  const [purchaseId, setPurchaseId] = useState(byWorkspace(data.purchases, workspaceId).find((item) => item.status !== "received")?.id ?? "");
  const purchase = data.purchases.find((item) => item.id === purchaseId);
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const scanned = rows.find((row) => row.variant.barcode === scan.trim() || row.variant.sku.toLowerCase() === scan.trim().toLowerCase());

  return (
    <div>
      <PageHeader title="Inventory" description="On-hand quantity is the sum of stock movements. Scanning here is a demo lookup, not a hardware integration." />
      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-muted">Tracked variants</p><p className="text-2xl font-semibold">{rows.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Low stock</p><p className="text-2xl font-semibold">{lows.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Value</p><p className="text-2xl font-semibold tabular-nums">{formatNgn(rows.reduce((sum, row) => sum + row.stock * row.variant.costKobo, 0))}</p></Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="grid gap-3 p-4">
          <h2 className="text-sm font-medium">Adjustment</h2>
          <Field label="Variant"><SelectInput value={variantId} onChange={(event) => setVariantId(event.target.value)}>{rows.map((row) => <option key={row.variant.id} value={row.variant.id}>{row.product.name} · {row.variant.name} ({row.stock})</option>)}</SelectInput></Field>
          <Field label="Quantity change" hint="Use a negative number to remove stock. The result cannot go below zero."><TextInput value={delta} onChange={(event) => setDelta(event.target.value)} /></Field>
          <Field label="Note"><TextInput value={note} onChange={(event) => setNote(event.target.value)} /></Field>
          <Button type="button" onClick={() => apply(adjustStock(data, { id: uid("mov"), workspaceId, variantId, delta: Number(delta), date: todayIso(), note, type: "adjustment" }))}>Record adjustment</Button>
          <h2 className="text-sm font-medium">Stocktake</h2>
          <Field label="Counted quantity"><TextInput value={counted} onChange={(event) => setCounted(event.target.value)} /></Field>
          <Button type="button" variant="secondary" onClick={() => apply(adjustStock(data, { id: uid("mov"), workspaceId, variantId, delta: 0, counted: Number(counted), date: todayIso(), note: note || "Stocktake", type: "stocktake" }))}>Record count</Button>
        </Card>
        <Card className="grid gap-3 p-4">
          <h2 className="text-sm font-medium">Barcode lookup</h2>
          <Field label="Scan or type a barcode or SKU" hint="No scanner hardware is connected."><TextInput value={scan} onChange={(event) => setScan(event.target.value)} placeholder="6154001000041" /></Field>
          {scan && !scanned ? <p className="text-sm text-danger">No variant matches that code in this workspace.</p> : null}
          {scanned ? <p className="text-sm">{scanned.product.name} · {scanned.variant.name} · {scanned.stock} on hand</p> : null}
          <h2 className="text-sm font-medium">Receive a purchase</h2>
          <Field label="Purchase"><SelectInput value={purchaseId} onChange={(event) => setPurchaseId(event.target.value)}>{byWorkspace(data.purchases, workspaceId).map((item) => <option key={item.id} value={item.id}>{item.reference} · {item.status}</option>)}</SelectInput></Field>
          {purchase?.lines.map((line) => {
            const variant = rows.find((row) => row.variant.id === line.variantId);
            return <Field key={line.id} label={`${variant?.product.name ?? "Item"} received now`} hint={`${line.receivedQty} of ${line.orderedQty} already received`}><TextInput value={receipts[line.id] ?? ""} onChange={(event) => setReceipts((current) => ({ ...current, [line.id]: event.target.value }))} /></Field>;
          })}
          <Button type="button" variant="secondary" onClick={() => purchase && apply(receivePurchase(data, { workspaceId, purchaseId: purchase.id, date: todayIso(), receipts: purchase.lines.map((line) => ({ lineId: line.id, qty: Number(receipts[line.id] || "0"), movementId: uid("mov") })) }))}>Receive stock</Button>
        </Card>
      </div>
      <h2 className="mt-6 mb-2 text-sm font-medium">Stock by variant</h2>
      <TableFrame>
        <thead><tr><Th>Product</Th><Th>Variant</Th><Th className="text-right">On hand</Th><Th className="text-right">Value</Th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.variant.id}>
              <Td>{row.product.name}{lows.some((item) => item.variantId === row.variant.id) ? <Badge tone="warn">Low</Badge> : null}</Td>
              <Td>{row.variant.name}</Td>
              <Td className="text-right tabular-nums">{row.stock}</Td>
              <Td className="text-right tabular-nums">{formatNgn(row.stock * row.variant.costKobo)}</Td>
            </tr>
          ))}
        </tbody>
      </TableFrame>
      <h2 className="mt-6 mb-2 text-sm font-medium">Movement history</h2>
      <TableFrame>
        <thead><tr><Th>Date</Th><Th>Type</Th><Th>Note</Th><Th className="text-right">Change</Th></tr></thead>
        <tbody>
          {[...movements].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20).map((movement) => (
            <tr key={movement.id}><Td>{formatDate(movement.at)}</Td><Td className="capitalize">{movement.type}</Td><Td>{movement.note}</Td><Td className="text-right tabular-nums">{movement.qtyDelta}</Td></tr>
          ))}
        </tbody>
      </TableFrame>
      <h2 className="mt-6 mb-2 text-sm font-medium">Label preview</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.slice(0, 3).map((row) => <BarcodeCard key={row.variant.id} name={row.product.name} variant={row.variant.name} price={formatNgn(row.variant.priceKobo)} code={row.variant.barcode || row.variant.sku} />)}
      </div>
      <Button type="button" className="mt-3" variant="secondary" onClick={() => window.print()}>Print labels</Button>
    </div>
  );
}

export function BarcodeCard({ name, variant, price, code }: { name: string; variant: string; price: string; code: string }) {
  const bars = code.split("").flatMap((char) => {
    const width = (char.charCodeAt(0) % 3) + 1;
    return [true, false, width > 1, false];
  });
  return (
    <div className="print-sheet rounded-md border border-line bg-white p-3 text-black">
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs">{variant} · {price}</p>
      <div className="mt-2 flex h-14 items-end gap-px" aria-hidden>
        {bars.map((on, index) => <span key={index} className={on ? "h-full w-0.5 bg-black" : "h-full w-px bg-transparent"} />)}
      </div>
      <p className="mt-1 text-center font-mono text-xs">{code}</p>
      <p className="text-center text-[11px] text-neutral-500">Visual preview only. Not a certified barcode.</p>
    </div>
  );
}
