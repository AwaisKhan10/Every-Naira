"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shell";
import { Button, EmptyState, Field, Modal, TableFrame, Td, TextArea, TextInput, Th } from "@/components/ui";
import { createCustomer, createShare, updateCustomer } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { formatNgn } from "@/lib/money";
import { orderTotals } from "@/lib/orders";
import { byWorkspace, customerBalance, ordersForCustomer } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the customer name."),
  email: z.string().trim().refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email or leave it blank."),
  phone: z.string(),
  city: z.string(),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

export function CustomersScreen() {
  const data = useDemoStore((state) => state.data);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [open, setOpen] = useState(false);
  const customers = byWorkspace(data.customers, data.activeWorkspaceId).filter((customer) => {
    if (query && !`${customer.name} ${customer.email}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (city !== "all" && customer.city !== city) return false;
    return true;
  });
  const cities = [...new Set(byWorkspace(data.customers, data.activeWorkspaceId).map((customer) => customer.city))];
  return (
    <div>
      <PageHeader title="Customers" description="Balances come from open orders. A new customer can be selected on the next order." actions={<Button onClick={() => setOpen(true)}>Add customer</Button>} />
      <div className="mb-3 grid gap-2 md:grid-cols-2">
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search customers" />
        <select className="h-10 rounded-md border border-line bg-surface px-3 text-sm" value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filter by city">
          <option value="all">All cities</option>
          {cities.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {customers.length === 0 ? <EmptyState title="No customers" body="Add a demonstration customer. Nothing is stored on a server." /> : (
        <TableFrame>
          <thead><tr><Th>Customer</Th><Th>City</Th><Th className="text-right">Outstanding</Th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}><Td><Link className="font-medium" href={`/customers/${customer.id}`}>{customer.name}</Link><div className="text-xs text-muted">{customer.email}</div></Td><Td>{customer.city}</Td><Td className="text-right tabular-nums">{formatNgn(customerBalance(data, customer.id))}</Td></tr>
            ))}
          </tbody>
        </TableFrame>
      )}
      <CustomerDialog open={open} onOpenChange={setOpen} customer={null} />
    </div>
  );
}

export function CustomerDetailScreen({ customerId }: { customerId: string }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const customer = data.customers.find((item) => item.id === customerId && item.workspaceId === data.activeWorkspaceId);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  if (!customer) return <EmptyState title="Customer not in this workspace" body="Return to the customer list." />;
  const orders = ordersForCustomer(data, customer.id);
  return (
    <div>
      <PageHeader title={customer.name} description={`${customer.city} · ${customer.phone} · ${customer.email}`} actions={<Button onClick={() => setOpen(true)}>Edit</Button>} />
      <p className="mb-3 text-sm text-muted">{customer.notes}</p>
      <p className="mb-4 text-sm">Outstanding <strong className="tabular-nums">{formatNgn(customerBalance(data, customer.id))}</strong></p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/orders/new" className="inline-flex h-10 items-center rounded-md bg-accent px-3 text-sm text-accent-ink">Use in a new order</Link>
        <Button type="button" variant="secondary" onClick={() => {
          const next = uid("share").replace(/[^a-z0-9]/gi, "").slice(0, 12);
          if (apply(createShare(data, { token: next, workspaceId: data.activeWorkspaceId, kind: "statement", recordId: customer.id, date: todayIso() }))) setToken(next);
        }}>Create local statement preview</Button>
      </div>
      {token ? <p className="mb-4 text-sm">Local preview only: <Link className="text-accent" href={`/share/${token}`}>{`/share/${token}`}</Link>. This is not a secure public link.</p> : null}
      <h2 className="mb-2 text-sm font-medium">Orders and payments</h2>
      <TableFrame>
        <thead><tr><Th>Order</Th><Th>Payment</Th><Th className="text-right">Total</Th><Th className="text-right">Outstanding</Th></tr></thead>
        <tbody>
          {orders.map((order) => {
            const totals = orderTotals(order);
            return <tr key={order.id}><Td><Link href={`/orders/${order.id}`}>{order.number}</Link><div className="text-xs text-muted">{formatDate(order.createdAt)}</div></Td><Td>{order.payments.length} payment{order.payments.length === 1 ? "" : "s"}</Td><Td className="text-right tabular-nums">{formatNgn(totals.totalKobo)}</Td><Td className="text-right tabular-nums">{formatNgn(order.status === "cancelled" ? 0 : totals.outstandingKobo)}</Td></tr>;
          })}
        </tbody>
      </TableFrame>
      <CustomerDialog open={open} onOpenChange={setOpen} customer={customer} />
    </div>
  );
}

function CustomerDialog({ open, onOpenChange, customer }: { open: boolean; onOpenChange: (open: boolean) => void; customer: Customer | null }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const form = useForm<Values>({ resolver: zodResolver(schema), values: { name: customer?.name ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "", city: customer?.city ?? "", notes: customer?.notes ?? "" } });
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={customer ? "Edit customer" : "Add customer"}>
      <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
        const payload = { ...values, id: customer?.id ?? uid("cus"), workspaceId: data.activeWorkspaceId, date: todayIso() };
        if (apply(customer ? updateCustomer(data, payload) : createCustomer(data, payload))) onOpenChange(false);
      })}>
        <Field label="Name" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <Field label="Email" error={form.formState.errors.email?.message}><TextInput {...form.register("email")} /></Field>
        <Field label="Phone"><TextInput {...form.register("phone")} /></Field>
        <Field label="City"><TextInput {...form.register("city")} /></Field>
        <Field label="Notes"><TextArea {...form.register("notes")} /></Field>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Modal>
  );
}
