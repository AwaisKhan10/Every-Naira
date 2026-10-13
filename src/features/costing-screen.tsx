"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell";
import { Button, Card, Field, SelectInput, TextInput } from "@/components/ui";
import { applyUnitCost, createPurchase } from "@/lib/domain";
import { todayIso, uid } from "@/lib/format";
import { formatMinor, formatNgn, formatPercentFromRatio, parseNairaToKobo, parseRate, rateScaleToKoboPerMajor } from "@/lib/money";
import { landedCost } from "@/lib/pricing";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { CurrencyCode } from "@/lib/types";

export function CostingScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const variants = byWorkspace(data.products, data.activeWorkspaceId).flatMap((product) => product.variants.map((variant) => ({ product, variant })));
  const [variantId, setVariantId] = useState(variants[0]?.variant.id ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [rate, setRate] = useState("1");
  const [qty, setQty] = useState("10");
  const [price, setPrice] = useState("7000");
  const [shipping, setShipping] = useState("0");
  const [duties, setDuties] = useState("0");
  const [other, setOther] = useState("0");
  const [selling, setSelling] = useState("18500");
  const selected = variants.find((item) => item.variant.id === variantId);

  const result = useMemo(() => {
    const quantity = Number(qty);
    const unit = currency === "NGN" ? parseNairaToKobo(price) : parseNairaToKobo(price);
    const rateScale = parseRate(rate);
    if (!unit || !rateScale || !Number.isInteger(quantity)) return { error: "Enter quantity, purchase price, and a sample rate." };
    return landedCost({
      lines: [{ qty: quantity, unitMinor: unit }],
      ngnKoboPerMajor: currency === "NGN" ? 100 : rateScaleToKoboPerMajor(rateScale),
      shippingKobo: parseNairaToKobo(shipping) ?? -1,
      dutiesKobo: parseNairaToKobo(duties) ?? -1,
      otherKobo: parseNairaToKobo(other) ?? -1,
    });
  }, [currency, duties, other, price, qty, rate, shipping]);

  const sellingKobo = parseNairaToKobo(selling);

  function saveBatch() {
    if (!selected || "error" in result || !result || !sellingKobo) return;
    const unit = parseNairaToKobo(price);
    const rateScale = parseRate(rate);
    if (!unit || !rateScale) return;
    apply(createPurchase(data, {
      id: uid("po"),
      workspaceId: data.activeWorkspaceId,
      supplierId: selected.product.supplierId ?? byWorkspace(data.suppliers, data.activeWorkspaceId)[0]?.id ?? "",
      reference: `PO-${uid("n").slice(-4).toUpperCase()}`,
      orderedAt: todayIso(),
      currency,
      ngnKoboPerMajor: currency === "NGN" ? 100 : rateScaleToKoboPerMajor(rateScale),
      shippingKobo: parseNairaToKobo(shipping) ?? 0,
      dutiesKobo: parseNairaToKobo(duties) ?? 0,
      otherKobo: parseNairaToKobo(other) ?? 0,
      paidKobo: 0,
      notes: "Created from the costing calculator. Sample rate only.",
      lines: [{ id: uid("pl"), variantId: selected.variant.id, orderedQty: Number(qty), unitMinor: unit }],
    }));
  }

  return (
    <div>
      <PageHeader title="True cost" description="Landed cost is calculated in the browser from the numbers you enter. Exchange rates are sample inputs, not live market rates. This is not tax or accounting advice." />
      {variants.length === 0 ? <p className="text-sm text-muted">Add a product before costing it.</p> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Product"><SelectInput value={variantId} onChange={(event) => setVariantId(event.target.value)}>{variants.map((item) => <option key={item.variant.id} value={item.variant.id}>{item.product.name} · {item.variant.name}</option>)}</SelectInput></Field>
            <Field label="Purchase currency"><SelectInput value={currency} onChange={(event) => { const next = event.target.value as CurrencyCode; setCurrency(next); setRate(next === "NGN" ? "1" : "1550"); }}><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option><option value="CNY">CNY</option></SelectInput></Field>
            <Field label="Sample rate (₦ per 1 major unit)" hint="Editable sample. Not a live rate."><TextInput value={rate} onChange={(event) => setRate(event.target.value)} /></Field>
            <Field label="Quantity"><TextInput value={qty} onChange={(event) => setQty(event.target.value)} /></Field>
            <Field label={`Purchase price (${currency})`}><TextInput value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
            <Field label="Shipping (₦)"><TextInput value={shipping} onChange={(event) => setShipping(event.target.value)} /></Field>
            <Field label="Duties and taxes (₦)"><TextInput value={duties} onChange={(event) => setDuties(event.target.value)} /></Field>
            <Field label="Other allocated costs (₦)"><TextInput value={other} onChange={(event) => setOther(event.target.value)} /></Field>
            <Field label="Selling price (₦)"><TextInput value={selling} onChange={(event) => setSelling(event.target.value)} /></Field>
          </Card>
          <Card className="p-4">
            {"error" in result || !result ? <p className="text-sm text-danger">{ "error" in result ? result.error : "Check the inputs."}</p> : (
              <dl className="grid gap-2 text-sm">
                <Row label="Goods in naira" value={formatNgn(result.goodsKobo)} />
                <Row label="Allocated extras" value={formatNgn(result.extrasKobo)} />
                <Row label="Total landed cost" value={formatNgn(result.totalKobo)} />
                <Row label="Unit landed cost" value={formatNgn(result.unitKobo)} />
                <Row label="Rounding remainder" value={formatNgn(result.remainderKobo)} />
                <Row label="Selling price" value={sellingKobo === null ? "—" : formatNgn(sellingKobo)} />
                <Row label="Estimated profit" value={sellingKobo === null ? "—" : formatNgn(sellingKobo - result.unitKobo)} />
                <Row label="Gross margin" value={sellingKobo === null ? "—" : formatPercentFromRatio(sellingKobo - result.unitKobo, sellingKobo)} />
              </dl>
            )}
            <p className="mt-3 text-xs text-muted">Unit landed cost = (converted purchase value + shipping + duties + other) ÷ quantity, rounded half away from zero. Remainder kobo stays visible.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={!selected || "error" in result} onClick={saveBatch}>Save as purchase batch</Button>
              <Button type="button" variant="secondary" disabled={!selected || "error" in result} onClick={() => selected && !("error" in result) && apply(applyUnitCost(data, { workspaceId: data.activeWorkspaceId, variantId: selected.variant.id, costKobo: result.unitKobo, date: todayIso(), historyId: uid("hist") }))}>Apply unit cost</Button>
            </div>
          </Card>
        </div>
      )}
      <h2 className="mt-6 mb-2 text-sm font-medium">Saved purchase batches</h2>
      <div className="grid gap-2">
        {byWorkspace(data.purchases, data.activeWorkspaceId).map((purchase) => (
          <Card key={purchase.id} className="px-4 py-3 text-sm">
            <p className="font-medium">{purchase.reference} · {purchase.currency} · {purchase.status}</p>
            <p className="text-muted">Sample rate {formatMinor(purchase.ngnKoboPerMajor, "NGN")} per 1 {purchase.currency}. {purchase.notes}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="tabular-nums">{value}</dd></div>;
}
