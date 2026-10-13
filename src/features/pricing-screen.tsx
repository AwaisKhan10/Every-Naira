"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell";
import { Button, Card, Field, SelectInput, TableFrame, Td, TextInput, Th } from "@/components/ui";
import { applyPrices, saveScenario, updateFee } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { applyBps, bpsToLabel, formatNgn, formatPercentFromRatio, parseNairaToKobo } from "@/lib/money";
import { discountImpact, marketplaceEstimate, roundPriceToNaira, suggestedPriceKobo } from "@/lib/pricing";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { MarketplaceChannel } from "@/lib/types";

const CHANNELS: { id: MarketplaceChannel; label: string }[] = [
  { id: "direct", label: "Direct sales" },
  { id: "jumia", label: "Jumia" },
  { id: "konga", label: "Konga" },
];

export function PricingScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const options = byWorkspace(data.products, data.activeWorkspaceId).flatMap((product) => product.variants.map((variant) => ({ product, variant })));
  const [variantId, setVariantId] = useState(options[0]?.variant.id ?? "");
  const [margin, setMargin] = useState("55");
  const [discount, setDiscount] = useState("0");
  const [channel, setChannel] = useState<MarketplaceChannel>("direct");
  const [bulk, setBulk] = useState("0");
  const [selected, setSelected] = useState<string[]>([]);
  const current = options.find((item) => item.variant.id === variantId);
  const marginBps = Math.round(Number(margin) * 100);
  const suggestion = current && Number.isFinite(marginBps) ? suggestedPriceKobo(current.variant.costKobo, marginBps) : { error: "Choose a product." };
  const suggested = suggestion && typeof suggestion === "number" ? roundPriceToNaira(suggestion) : null;
  const discountKobo = parseNairaToKobo(discount) ?? -1;
  const impact = current && discountKobo >= 0 ? discountImpact(current.variant.priceKobo, current.variant.costKobo, discountKobo) : { error: "Enter a discount." };
  const fee = data.fees.find((item) => item.workspaceId === data.activeWorkspaceId && item.channel === channel);
  const estimate = current && fee ? marketplaceEstimate(current.variant.priceKobo, current.variant.costKobo, fee) : null;
  const bulkBps = Math.round(Number(bulk) * 100);
  const preview = Number.isFinite(bulkBps)
    ? options.filter((item) => selected.includes(item.variant.id)).map((item) => ({
        ...item,
        next: roundPriceToNaira(item.variant.priceKobo + applyBps(item.variant.priceKobo, bulkBps)),
      }))
    : [];

  function saveFees(form: FormData) {
    const read = (name: string) => Math.round(Number(form.get(name)) * 100);
    const fixed = (name: string) => parseNairaToKobo(String(form.get(name) ?? ""));
    const fulfilment = fixed("fulfilment");
    const other = fixed("other");
    if (fulfilment === null || other === null) return;
    apply(updateFee(data, { workspaceId: data.activeWorkspaceId, channel, commissionBps: read("commission"), marketplaceBps: read("marketplace"), paymentBps: read("payment"), fulfilmentKobo: fulfilment, otherKobo: other, date: todayIso() }));
  }

  return (
    <div>
      <PageHeader title="Pricing studio" description="Demo mode — manual fee inputs. Jumia and Konga cards use illustrative sample fees you can edit. They are not official tariffs or guaranteed payouts." />
      {options.length === 0 ? <p className="text-sm text-muted">Add a product to price it.</p> : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="grid gap-3 p-4 xl:col-span-2">
            <Field label="Product"><SelectInput value={variantId} onChange={(event) => setVariantId(event.target.value)}>{options.map((item) => <option key={item.variant.id} value={item.variant.id}>{item.product.name} · {item.variant.name}</option>)}</SelectInput></Field>
            {current ? (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Current cost</dt><dd className="tabular-nums">{formatNgn(current.variant.costKobo)}</dd></div>
                <div><dt className="text-muted">Current price</dt><dd className="tabular-nums">{formatNgn(current.variant.priceKobo)}</dd></div>
                <div><dt className="text-muted">Current margin</dt><dd>{formatPercentFromRatio(current.variant.priceKobo - current.variant.costKobo, current.variant.priceKobo)}</dd></div>
              </dl>
            ) : null}
            <Field label="Target margin %" hint="Suggested price = cost ÷ (1 − margin), then rounded to the nearest naira."><TextInput value={margin} onChange={(event) => setMargin(event.target.value)} /></Field>
            <p className="text-sm">Suggested selling price: <strong className="tabular-nums">{suggested === null ? "Enter a margin below 100%." : formatNgn(suggested)}</strong></p>
            <Button type="button" variant="secondary" disabled={suggested === null || !current} onClick={() => current && suggested !== null && apply(saveScenario(data, { id: uid("sc"), workspaceId: data.activeWorkspaceId, name: `${current.product.name} ${margin}%`, variantId: current.variant.id, priceKobo: suggested, note: "Saved from the target margin.", date: todayIso() }))}>Save scenario</Button>
            <Field label="Discount amount (₦)"><TextInput value={discount} onChange={(event) => setDiscount(event.target.value)} /></Field>
            {"error" in impact ? <p className="text-sm text-danger">{impact.error}</p> : <p className="text-sm">After discount {formatNgn(impact.discountedKobo)} · profit {formatNgn(impact.profitKobo)} · margin {impact.marginLabel}</p>}
          </Card>
          <Card className="p-4">
            <div className="mb-3 flex gap-1" role="tablist" aria-label="Marketplace">
              {CHANNELS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={channel === item.id} className={`h-9 rounded-md px-2 text-xs ${channel === item.id ? "bg-accent text-accent-ink" : "bg-surface-2"}`} onClick={() => setChannel(item.id)}>{item.label}</button>)}
            </div>
            <p className="mb-3 text-xs text-muted">Demo mode — manual fee inputs. A later integration would replace these with a dated, sourced fee schedule.</p>
            {fee ? (
              <form className="grid gap-2" action={(form) => saveFees(form)}>
                <Field label="Commission %"><TextInput name="commission" defaultValue={String(fee.commissionBps / 100)} key={`${fee.channel}-c`} /></Field>
                <Field label="Marketplace fee %"><TextInput name="marketplace" defaultValue={String(fee.marketplaceBps / 100)} key={`${fee.channel}-m`} /></Field>
                <Field label="Payment fee %"><TextInput name="payment" defaultValue={String(fee.paymentBps / 100)} key={`${fee.channel}-p`} /></Field>
                <Field label="Fulfilment (₦)"><TextInput name="fulfilment" defaultValue={String(fee.fulfilmentKobo / 100)} key={`${fee.channel}-f`} /></Field>
                <Field label="Other (₦)"><TextInput name="other" defaultValue={String(fee.otherKobo / 100)} key={`${fee.channel}-o`} /></Field>
                <Button type="submit" variant="secondary">Save illustrative fees</Button>
              </form>
            ) : null}
            {estimate && !("error" in estimate) ? (
              <dl className="mt-4 grid gap-1 text-sm">
                <div className="flex justify-between"><dt>Fees</dt><dd className="tabular-nums">{formatNgn(estimate.feesKobo)}</dd></div>
                <div className="flex justify-between"><dt>Estimated net</dt><dd className="tabular-nums">{formatNgn(estimate.netKobo)}</dd></div>
                <div className="flex justify-between"><dt>Estimated profit</dt><dd className="tabular-nums">{formatNgn(estimate.profitKobo)}</dd></div>
              </dl>
            ) : null}
            <p className="mt-2 text-xs text-muted">Updated {fee ? formatDate(fee.updatedAt) : "—"}. Rates shown as {fee ? bpsToLabel(fee.commissionBps) : "—"} commission.</p>
          </Card>
        </div>
      )}
      <h2 className="mt-6 mb-2 text-sm font-medium">Bulk price preview</h2>
      <div className="mb-2 flex flex-wrap items-end gap-2">
        <Field label="Percent change"><TextInput value={bulk} onChange={(event) => setBulk(event.target.value)} className="w-28" /></Field>
        <Button type="button" variant="secondary" disabled={preview.length === 0} onClick={() => apply(applyPrices(data, { workspaceId: data.activeWorkspaceId, date: todayIso(), note: `Bulk ${bulk}%`, changes: preview.map((item) => ({ variantId: item.variant.id, priceKobo: item.next, historyId: uid("pc") })) }))}>Apply preview</Button>
      </div>
      <TableFrame>
        <thead><tr><Th><span className="sr-only">Select</span></Th><Th>Variant</Th><Th className="text-right">Current</Th><Th className="text-right">Preview</Th></tr></thead>
        <tbody>
          {options.map((item) => {
            const row = preview.find((entry) => entry.variant.id === item.variant.id);
            return (
              <tr key={item.variant.id}>
                <Td><input type="checkbox" aria-label={`Select ${item.product.name}`} checked={selected.includes(item.variant.id)} onChange={(event) => setSelected((currentIds) => event.target.checked ? [...currentIds, item.variant.id] : currentIds.filter((id) => id !== item.variant.id))} /></Td>
                <Td>{item.product.name} · {item.variant.name}</Td>
                <Td className="text-right tabular-nums">{formatNgn(item.variant.priceKobo)}</Td>
                <Td className="text-right tabular-nums">{row ? formatNgn(row.next) : "—"}</Td>
              </tr>
            );
          })}
        </tbody>
      </TableFrame>
      <h2 className="mt-6 mb-2 text-sm font-medium">Pricing history and scenarios</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {byWorkspace(data.priceChanges, data.activeWorkspaceId).map((change) => <Card key={change.id} className="px-3 py-2 text-sm">{formatDate(change.at)} · {formatNgn(change.oldPriceKobo)} → {formatNgn(change.newPriceKobo)} · {change.note}</Card>)}
        {byWorkspace(data.scenarios, data.activeWorkspaceId).map((scenario) => <Card key={scenario.id} className="px-3 py-2 text-sm">{scenario.name} · {formatNgn(scenario.priceKobo)} · {scenario.note}</Card>)}
      </div>
    </div>
  );
}
