"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shell";
import { Button, Card } from "@/components/ui";
import { BarcodeCard } from "@/features/inventory-screen";
import { formatDate } from "@/lib/format";
import { formatNgn } from "@/lib/money";
import { orderTotals } from "@/lib/orders";
import { customerBalance } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";

export function DocumentsScreen() {
  const data = useDemoStore((state) => state.data);
  const orders = data.orders.filter((order) => order.workspaceId === data.activeWorkspaceId && order.status !== "cancelled");
  const customers = data.customers.filter((customer) => customer.workspaceId === data.activeWorkspaceId);
  const projects = data.projects.filter((project) => project.workspaceId === data.activeWorkspaceId);
  return (
    <div>
      <PageHeader title="Documents" description="Previews use the current demonstration records. Print with the browser. PDF download builds a simple file on this device." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium">Invoices, receipts, and packing slips</h2>
          <ul className="grid gap-2 text-sm">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap gap-3">
                <span className="w-24">{order.number}</span>
                <Link className="text-accent" href={`/documents/invoice/${order.id}`}>Invoice</Link>
                <Link className="text-accent" href={`/documents/receipt/${order.id}`}>Receipt</Link>
                <Link className="text-accent" href={`/documents/packing/${order.id}`}>Packing slip</Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium">Statements, labels, and tech packs</h2>
          <ul className="grid gap-2 text-sm">
            {customers.map((customer) => <li key={customer.id}><Link className="text-accent" href={`/documents/statement/${customer.id}`}>{customer.name} statement</Link></li>)}
            <li><Link className="text-accent" href="/documents/labels/all">Barcode labels</Link></li>
            {projects.map((project) => <li key={project.id}><Link className="text-accent" href={`/documents/techpack/${project.id}`}>{project.name} mini tech pack</Link></li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function DocumentView({ kind, recordId }: { kind: string; recordId: string }) {
  const data = useDemoStore((state) => state.data);
  const workspace = data.workspaces.find((item) => item.id === data.activeWorkspaceId);
  const order = data.orders.find((item) => item.id === recordId);
  const customer = data.customers.find((item) => item.id === (kind === "statement" ? recordId : order?.customerId));
  const project = data.projects.find((item) => item.id === recordId);
  const totals = order ? orderTotals(order) : null;

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(workspace?.name ?? "Demonstration", 14, 18);
    doc.setFontSize(11);
    doc.text(`${kind} ${order?.number ?? customer?.name ?? project?.name ?? ""}`, 14, 28);
    doc.text("Demonstration document. Not a tax invoice from a live system.", 14, 36);
    let y = 48;
    if (order && totals) {
      order.lines.forEach((line) => {
        doc.text(`${line.name} × ${line.qty}  ${formatNgn(line.unitPriceKobo)}`, 14, y);
        y += 8;
      });
      doc.text(`Total ${formatNgn(totals.totalKobo)}`, 14, y + 4);
    }
    doc.save(`${kind}-${order?.number ?? recordId}.pdf`);
  }

  return (
    <div>
      <div className="no-print mb-4 flex gap-2">
        <Button type="button" onClick={() => window.print()}>Print</Button>
        <Button type="button" variant="secondary" onClick={() => void downloadPdf()}>Download PDF</Button>
        <Link href="/documents" className="inline-flex h-10 items-center text-sm text-accent">All documents</Link>
      </div>
      <article className="print-sheet mx-auto max-w-3xl rounded-lg border border-line bg-white p-8 text-black">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <p className="text-xs tracking-wide text-neutral-500 uppercase">Demonstration document</p>
            <h1 className="font-serif text-2xl">{workspace?.name}</h1>
            <p className="text-sm text-neutral-600">{workspace?.address}</p>
            <p className="text-sm text-neutral-600">{workspace?.phone} · {workspace?.email}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium capitalize">{kind}</p>
            <p>{order?.number ?? project?.name ?? customer?.name}</p>
            <p>{formatDate(order?.createdAt ?? project?.updatedAt ?? customer?.createdAt ?? "2026-10-13")}</p>
          </div>
        </header>
        {kind === "techpack" && project ? (
          <div className="mt-6 grid gap-3 text-sm">
            <p className="text-xs text-neutral-500">Supplier-safe preview. Customer prices are omitted.</p>
            <h2 className="text-lg">{project.name}</h2>
            <p>{project.concept}</p>
            <p><strong>Materials. </strong>{project.materials}</p>
            <p><strong>Measurements. </strong>{project.measurements}</p>
            <p><strong>Components. </strong>{project.components}</p>
            <p><strong>Specifications. </strong>{project.specs}</p>
            <p><strong>Supplier notes. </strong>{project.supplierNotes}</p>
            <p><strong>Estimated cost. </strong>{formatNgn(project.estimatedCostKobo)}</p>
          </div>
        ) : null}
        {kind === "labels" ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {data.products.filter((product) => product.workspaceId === data.activeWorkspaceId && product.trackStock).flatMap((product) => product.variants.map((variant) => (
              <BarcodeCard key={variant.id} name={product.name} variant={variant.name} price={formatNgn(variant.priceKobo)} code={variant.barcode || variant.sku} />
            )))}
          </div>
        ) : null}
        {kind === "statement" && customer ? (
          <div className="mt-6 text-sm">
            <p className="mb-3">{customer.name} · {customer.city}</p>
            <table className="w-full text-left">
              <thead><tr><th>Order</th><th>Date</th><th className="text-right">Outstanding</th></tr></thead>
              <tbody>
                {data.orders.filter((item) => item.customerId === customer.id).map((item) => (
                  <tr key={item.id} className="border-t border-neutral-200"><td className="py-2">{item.number}</td><td>{formatDate(item.createdAt)}</td><td className="text-right">{formatNgn(item.status === "cancelled" ? 0 : orderTotals(item).outstandingKobo)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 font-medium">Balance {formatNgn(customerBalance(data, customer.id))}</p>
          </div>
        ) : null}
        {order && totals && kind !== "techpack" && kind !== "labels" && kind !== "statement" ? (
          <div className="mt-6 text-sm">
            <p className="mb-3">{customer?.name} · {customer?.city}</p>
            <table className="w-full text-left">
              <thead><tr><th>Description</th><th className="text-right">Qty</th>{kind === "packing" ? null : <th className="text-right">Amount</th>}</tr></thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id} className="border-t border-neutral-200">
                    <td className="py-2">{line.name} · {line.variantName}</td>
                    <td className="text-right">{line.qty}</td>
                    {kind === "packing" ? null : <td className="text-right">{formatNgn(line.qty * line.unitPriceKobo - line.discountKobo)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {kind === "packing" ? <p className="mt-4 text-neutral-600">Packing slip. Prices are hidden.</p> : (
              <div className="mt-4 ml-auto max-w-xs space-y-1">
                <p className="flex justify-between"><span>Delivery fee</span><span>{formatNgn(order.deliveryFeeKobo)}</span></p>
                <p className="flex justify-between font-medium"><span>Total</span><span>{formatNgn(totals.totalKobo)}</span></p>
                {kind === "receipt" ? <p className="flex justify-between"><span>Received (simulated)</span><span>{formatNgn(totals.netPaidKobo)}</span></p> : <p className="flex justify-between"><span>Outstanding</span><span>{formatNgn(totals.outstandingKobo)}</span></p>}
              </div>
            )}
          </div>
        ) : null}
        <p className="mt-8 text-xs text-neutral-500">Sample business information. Currency is Nigerian naira. This preview is not a filing-ready tax document.</p>
      </article>
    </div>
  );
}
