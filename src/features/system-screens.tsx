"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, Field, Modal, TextArea, TextInput } from "@/components/ui";
import { saveIntegrationNote, setLowStockAt, setPlan, setRole } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { formatNgn } from "@/lib/money";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

const PLANS: { id: PlanId; name: string; price: number; points: string[] }[] = [
  { id: "starter", name: "Starter", price: 1_500_000, points: ["1 workspace", "Products, orders, and stock", "CSV import"] },
  { id: "growth", name: "Growth", price: 3_500_000, points: ["Pricing studio", "Documents and labels", "Goals and reports"] },
  { id: "scale", name: "Scale", price: 7_500_000, points: ["Supplier costing", "Team roles in the full product", "Priority support in a live deployment"] },
];

const PROVIDERS = [
  { id: "bumpa", name: "Bumpa", purpose: "Catalogue and order sync for Bumpa stores.", setup: "A Bumpa partner account and API credentials from the client.", capabilities: "Product and order sync once access is granted.", fallback: "Use CSV import and export." },
  { id: "shopify", name: "Shopify", purpose: "Read products and orders from a Shopify store.", setup: "A custom app with read scopes, installed by the store owner.", capabilities: "Product and order import.", fallback: "Manual product entry or CSV." },
  { id: "woocommerce", name: "WooCommerce", purpose: "Read products and orders from WooCommerce.", setup: "REST API keys with read permission.", capabilities: "Product and order import.", fallback: "CSV import." },
  { id: "jumia", name: "Jumia", purpose: "Marketplace fee and pricing reference.", setup: "An official fee schedule or partner API. Neither is connected.", capabilities: "Fee-aware price estimates.", fallback: "Manual illustrative fees in Pricing." },
  { id: "konga", name: "Konga", purpose: "Marketplace fee and pricing reference.", setup: "An official fee schedule or partner API. Neither is connected.", capabilities: "Fee-aware price estimates.", fallback: "Manual illustrative fees in Pricing." },
  { id: "whatsapp", name: "WhatsApp", purpose: "Send order and payment messages.", setup: "A WhatsApp Business account and an approved provider.", capabilities: "Templated customer messages.", fallback: "Copy a draft from the WhatsApp centre." },
  { id: "email", name: "Email", purpose: "Send invoices and reminders.", setup: "An email provider and a verified sending domain.", capabilities: "Invoice and receipt email.", fallback: "Print or download the document." },
  { id: "payment", name: "Payments", purpose: "Collect order payments and subscription fees.", setup: "A payment provider account and webhook secret.", capabilities: "Checkout and payment status.", fallback: "Record a simulated payment on the order." },
];

export function IntegrationsScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const provider = PROVIDERS.find((item) => item.id === open);
  return (
    <div>
      <PageHeader title="Integrations" description="Nothing here is connected. Connect opens setup notes only. No OAuth, sync, or provider success is simulated." />
      <div className="grid gap-3 md:grid-cols-2">
        {PROVIDERS.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center justify-between gap-2"><h2 className="font-medium">{item.name}</h2><Badge tone="warn">Not connected</Badge></div>
            <p className="mt-2 text-sm text-muted">{item.purpose}</p>
            <p className="mt-2 text-xs text-muted">Status: setup required · demo mode · manual workflow available</p>
            {data.integrationNotes[item.id] ? <p className="mt-2 text-sm">Saved note: {data.integrationNotes[item.id]}</p> : null}
            <Button className="mt-3" variant="secondary" onClick={() => { setOpen(item.id); setNotes(data.integrationNotes[item.id] ?? ""); }}>Configure</Button>
          </Card>
        ))}
      </div>
      <Modal open={provider !== undefined} onOpenChange={(value) => { if (!value) setOpen(null); }} title={provider ? `${provider.name} setup` : "Setup"} description="Demo mode. Saving a note does not connect the provider.">
        {provider ? (
          <div className="grid gap-3 text-sm">
            <p><strong>Required setup. </strong>{provider.setup}</p>
            <p><strong>Planned capability. </strong>{provider.capabilities}</p>
            <p><strong>Manual fallback. </strong>{provider.fallback}</p>
            <Field label="Local note"><TextArea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
            <Button type="button" onClick={() => { apply(saveIntegrationNote(data, provider.id, notes)); setOpen(null); }}>Save note in this browser</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function BillingScreen() {
  const data = useDemoStore((state) => state.data);
  const current = PLANS.find((plan) => plan.id === data.billing.planId) ?? PLANS[0];
  return (
    <div>
      <PageHeader title="Billing" description="Demonstration plan prices, not a live offer. Checkout does not collect card details or charge money." />
      <Card className="mb-4 p-4">
        <p className="text-xs text-muted">Current demonstration plan</p>
        <p className="text-xl font-semibold">{current.name}</p>
        <Badge tone="info">Demonstration preview — not an active paid subscription</Badge>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className="p-4">
            <h2 className="font-medium">{plan.name}</h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatNgn(plan.price)}<span className="text-sm font-normal text-muted"> / month</span></p>
            <ul className="mt-3 grid gap-1 text-sm text-muted">{plan.points.map((point) => <li key={point}>{point}</li>)}</ul>
            <Link href={`/billing/checkout?plan=${plan.id}`} className="mt-4 inline-flex h-10 items-center rounded-md bg-accent px-3 text-sm text-accent-ink">{plan.id === data.billing.planId ? "Current preview" : "Preview change"}</Link>
          </Card>
        ))}
      </div>
      <h2 className="mt-6 mb-2 text-sm font-medium">Invoice history</h2>
      <ul className="grid gap-2 text-sm">
        {data.billing.invoices.map((invoice) => <li key={invoice.id} className="flex justify-between rounded-md border border-line bg-surface px-3 py-2"><span>{formatDate(invoice.at)} · {invoice.description}</span><span>{formatNgn(invoice.amountKobo)} · {invoice.state.replaceAll("_", " ")}</span></li>)}
      </ul>
    </div>
  );
}

export function CheckoutScreen({ planId, outcome }: { planId?: string; outcome?: "success" | "failed" | "cancelled" }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const plan = PLANS.find((item) => item.id === planId) ?? PLANS[1];
  const [confirmCancel, setConfirmCancel] = useState(false);
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Checkout preview" description="This is a simulation. Do not enter card details. No payment provider is contacted." />
      <Card className="grid gap-3 p-4">
        <p className="text-sm">{plan.name} · {formatNgn(plan.price)} per month · demonstration price</p>
        {outcome === "success" ? <p className="text-sm">Simulated success. No payment was taken and the subscription is not genuinely active.</p> : null}
        {outcome === "failed" ? <p className="text-sm text-danger">Simulated failure. The demonstration plan was not changed.</p> : null}
        {outcome === "cancelled" ? <p className="text-sm">Checkout was cancelled. Nothing was charged.</p> : null}
        {outcome ? null : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => apply(setPlan(data, { planId: plan.id, invoice: { id: `bin_${Date.now()}`, at: "2026-10-13", description: `${plan.name} plan — simulated`, amountKobo: plan.price, state: "simulated_paid" } }))}>Simulate successful payment</Button>
            <Link href="/billing/failed" className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm">Simulate failure</Link>
            <Link href="/billing/cancelled" className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm">Cancel checkout</Link>
          </div>
        )}
        <Button type="button" variant="danger" onClick={() => setConfirmCancel(true)}>Cancel subscription preview</Button>
        {confirmCancel ? <p className="text-sm">Confirming this only marks the demonstration plan as starter. <Button size="sm" variant="secondary" onClick={() => apply(setPlan(data, { planId: "starter", invoice: { id: `bin_${Date.now()}`, at: "2026-10-13", description: "Cancellation preview", amountKobo: 0, state: "simulated_cancelled" } }))}>Confirm</Button></p> : null}
        <Link href="/billing" className="text-sm text-accent">Back to billing</Link>
      </Card>
    </div>
  );
}

export function AdminScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const reset = useDemoStore((state) => state.reset);
  const [threshold, setThreshold] = useState(String(data.workspaces.find((item) => item.id === data.activeWorkspaceId)?.lowStockAt ?? 3));
  if (data.role === "staff") {
    return (
      <div>
        <PageHeader title="Admin" description="This gate is a demonstration role switch in the browser. It is not production security." />
        <Card className="p-4 text-sm">The staff demonstration role cannot open admin. Use the profile menu and choose “View as owner” or “View as admin”.</Card>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Admin" description="Sample users and settings. Changing the role here does not create a real privilege. Reset replaces browser data with the original sample business." />
      <div className="mb-4 flex gap-2">
        <Button variant="secondary" onClick={() => apply(setRole(data, "owner"))}>View as owner</Button>
        <Button variant="secondary" onClick={() => apply(setRole(data, "admin"))}>View as admin</Button>
        <Button variant="secondary" onClick={() => apply(setRole(data, "staff"))}>View as staff</Button>
      </div>
      <h2 className="mb-2 text-sm font-medium">Sample users</h2>
      <ul className="mb-4 grid gap-2 text-sm">{data.users.map((user) => <li key={user.id} className="flex justify-between rounded-md border border-line bg-surface px-3 py-2"><span>{user.name} · {user.email}</span><span>{user.role} · {user.status}</span></li>)}</ul>
      <h2 className="mb-2 text-sm font-medium">Workspace snapshot</h2>
      <p className="mb-4 text-sm">{byWorkspace(data.products, data.activeWorkspaceId).length} products · {byWorkspace(data.orders, data.activeWorkspaceId).length} orders · plan {data.billing.planId}</p>
      <h2 className="mb-2 text-sm font-medium">Activity</h2>
      <ul className="mb-4 grid gap-1 text-sm">{byWorkspace(data.activity, data.activeWorkspaceId).slice(0, 8).map((item) => <li key={item.id}>{formatDate(item.at)} · {item.message}</li>)}</ul>
      <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); apply(setLowStockAt(data, data.activeWorkspaceId, Number(threshold))); }}>
        <Field label="Low-stock threshold"><TextInput value={threshold} onChange={(event) => setThreshold(event.target.value)} className="w-28" /></Field>
        <Button type="submit" variant="secondary">Save threshold</Button>
      </form>
      <h2 className="mb-2 text-sm font-medium">Support notes from the contact form</h2>
      <ul className="mb-4 grid gap-2 text-sm">{data.supportNotes.length === 0 ? <li className="text-muted">None yet.</li> : data.supportNotes.map((note) => <li key={note.id}>{note.name} · {note.topic} · {note.message}</li>)}</ul>
      <Button variant="danger" onClick={() => { useDemoStore.persist.clearStorage(); reset(); }}>Reset demo data</Button>
    </div>
  );
}
