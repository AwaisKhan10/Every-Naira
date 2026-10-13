"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shell";
import { Button, EmptyState, Field, Modal, TableFrame, Td, TextArea, TextInput, Th } from "@/components/ui";
import { createSupplier, updateSupplier } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { formatMinor, formatNgn } from "@/lib/money";
import { purchaseLanded } from "@/lib/pricing";
import { byWorkspace, supplierOutstanding } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { Supplier } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a supplier name."),
  contactName: z.string(),
  email: z.string(),
  phone: z.string(),
  city: z.string(),
  notes: z.string(),
});

type Values = z.infer<typeof schema>;

export function SuppliersScreen() {
  const data = useDemoStore((state) => state.data);
  const [open, setOpen] = useState(false);
  const suppliers = byWorkspace(data.suppliers, data.activeWorkspaceId);
  return (
    <div>
      <PageHeader title="Suppliers" description="Supplier balances are calculated from purchase batches minus the sample amount marked paid." actions={<Button onClick={() => setOpen(true)}>Add supplier</Button>} />
      {suppliers.length === 0 ? <EmptyState title="No suppliers yet" body="Add a supplier, then record a purchase from the costing page or a supplier detail page." /> : (
        <TableFrame>
          <thead><tr><Th>Supplier</Th><Th>City</Th><Th className="text-right">Outstanding</Th></tr></thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <Td><Link className="font-medium" href={`/suppliers/${supplier.id}`}>{supplier.name}</Link><div className="text-xs text-muted">{supplier.contactName}</div></Td>
                <Td>{supplier.city}</Td>
                <Td className="text-right tabular-nums">{formatNgn(supplierOutstanding(data, supplier.id))}</Td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
      <SupplierDialog open={open} onOpenChange={setOpen} supplier={null} />
    </div>
  );
}

export function SupplierDetailScreen({ supplierId }: { supplierId: string }) {
  const data = useDemoStore((state) => state.data);
  const supplier = data.suppliers.find((item) => item.id === supplierId && item.workspaceId === data.activeWorkspaceId);
  const [open, setOpen] = useState(false);
  if (!supplier) return <EmptyState title="Supplier not in this workspace" body="Choose a supplier from the list." action={<Link href="/suppliers" className="text-accent">Back</Link>} />;
  const purchases = data.purchases.filter((purchase) => purchase.supplierId === supplier.id);
  const products = data.products.filter((product) => product.supplierId === supplier.id);
  return (
    <div>
      <PageHeader title={supplier.name} description={`${supplier.contactName} · ${supplier.city} · ${supplier.phone}`} actions={<Button onClick={() => setOpen(true)}>Edit</Button>} />
      <p className="mb-4 text-sm text-muted">{supplier.email} · {supplier.notes}</p>
      <p className="mb-4 text-sm">Demonstration outstanding balance: <strong className="tabular-nums">{formatNgn(supplierOutstanding(data, supplier.id))}</strong></p>
      <h2 className="mb-2 text-sm font-medium">Products</h2>
      <ul className="mb-4 grid gap-1 text-sm">{products.map((product) => <li key={product.id}><Link className="text-accent" href={`/products/${product.id}`}>{product.name}</Link></li>)}</ul>
      <h2 className="mb-2 text-sm font-medium">Purchases</h2>
      <TableFrame>
        <thead><tr><Th>Reference</Th><Th>Status</Th><Th>Received</Th><Th className="text-right">Landed</Th><Th className="text-right">Paid</Th></tr></thead>
        <tbody>
          {purchases.map((purchase) => {
            const landed = purchaseLanded(purchase);
            const received = purchase.lines.reduce((sum, line) => sum + line.receivedQty, 0);
            const ordered = purchase.lines.reduce((sum, line) => sum + line.orderedQty, 0);
            return (
              <tr key={purchase.id}>
                <Td>{purchase.reference}<div className="text-xs text-muted">{formatDate(purchase.orderedAt)} · {formatMinor(purchase.ngnKoboPerMajor, "NGN")} / {purchase.currency}</div></Td>
                <Td className="capitalize">{purchase.status}</Td>
                <Td>{received} / {ordered}</Td>
                <Td className="text-right tabular-nums">{"error" in landed ? "—" : formatNgn(landed.totalKobo)}</Td>
                <Td className="text-right tabular-nums">{formatNgn(purchase.paidKobo)}</Td>
              </tr>
            );
          })}
        </tbody>
      </TableFrame>
      <SupplierDialog open={open} onOpenChange={setOpen} supplier={supplier} />
    </div>
  );
}

function SupplierDialog({ open, onOpenChange, supplier }: { open: boolean; onOpenChange: (open: boolean) => void; supplier: Supplier | null }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: supplier?.name ?? "", contactName: supplier?.contactName ?? "", email: supplier?.email ?? "", phone: supplier?.phone ?? "", city: supplier?.city ?? "", notes: supplier?.notes ?? "" },
  });
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={supplier ? "Edit supplier" : "Add supplier"}>
      <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
        const payload = { ...values, id: supplier?.id ?? uid("sup"), workspaceId: data.activeWorkspaceId, date: todayIso() };
        const result = supplier ? updateSupplier(data, payload) : createSupplier(data, payload);
        if (apply(result)) onOpenChange(false);
      })}>
        <Field label="Name" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <Field label="Contact"><TextInput {...form.register("contactName")} /></Field>
        <Field label="Email"><TextInput {...form.register("email")} /></Field>
        <Field label="Phone"><TextInput {...form.register("phone")} /></Field>
        <Field label="City"><TextInput {...form.register("city")} /></Field>
        <Field label="Notes"><TextArea {...form.register("notes")} /></Field>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Modal>
  );
}
