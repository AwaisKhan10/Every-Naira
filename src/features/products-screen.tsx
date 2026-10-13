"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shell";
import { Badge, Button, EmptyState, Field, Modal, Pager, SelectInput, TableFrame, Td, TextArea, TextInput, Th } from "@/components/ui";
import { createProduct, updateProduct } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { productStock } from "@/lib/inventory";
import { formatNgn, parseNairaToKobo } from "@/lib/money";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { Product, ProductStatus, ProductType } from "@/lib/types";

const variantSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name the variant."),
  sku: z.string().trim().min(2, "Enter a SKU."),
  barcode: z.string(),
  cost: z.string().refine((value) => parseNairaToKobo(value) !== null, "Enter a cost such as 8000."),
  price: z.string().refine((value) => parseNairaToKobo(value) !== null, "Enter a selling price."),
  openingQty: z.string().refine((value) => value === "" || /^\d+$/.test(value), "Opening quantity must be a whole number."),
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter a product name."),
  type: z.enum(["physical", "digital", "service"]),
  status: z.enum(["active", "draft", "archived"]),
  categoryId: z.string().min(1, "Choose a category."),
  supplierId: z.string(),
  description: z.string(),
  trackStock: z.boolean(),
  variants: z.array(variantSchema).min(1, "Add a variant."),
});

type FormValues = z.infer<typeof schema>;

function moneyToInput(kobo: number): string {
  return `${Math.trunc(kobo / 100)}.${String(Math.abs(kobo) % 100).padStart(2, "0")}`;
}

export function ProductsScreen() {
  const data = useDemoStore((state) => state.data);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | ProductType>("all");
  const [status, setStatus] = useState<"all" | ProductStatus>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const categories = byWorkspace(data.categories, data.activeWorkspaceId);
  const products = useMemo(() => {
    return byWorkspace(data.products, data.activeWorkspaceId).filter((product) => {
      const haystack = `${product.name} ${product.variants.map((variant) => variant.sku).join(" ")}`.toLowerCase();
      if (query && !haystack.includes(query.trim().toLowerCase())) return false;
      if (type !== "all" && product.type !== type) return false;
      if (status !== "all" && product.status !== status) return false;
      if (categoryId !== "all" && product.categoryId !== categoryId) return false;
      return true;
    });
  }, [data, query, type, status, categoryId]);
  const pages = Math.max(1, Math.ceil(products.length / 8));
  const current = Math.min(page, pages);
  const rows = products.slice((current - 1) * 8, current * 8);

  return (
    <div>
      <PageHeader title="Products" description="Physical, digital, and service products for this workspace. New and edited products update the tables, stock, and dashboard immediately." actions={<Button onClick={() => setOpen(true)}>Add product</Button>} />
      <div className="mb-3 grid gap-2 md:grid-cols-4">
        <TextInput value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name or SKU" aria-label="Search products" />
        <SelectInput value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </SelectInput>
        <SelectInput value={type} onChange={(event) => { setType(event.target.value as typeof type); setPage(1); }} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
          <option value="service">Service</option>
        </SelectInput>
        <SelectInput value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </SelectInput>
      </div>
      {rows.length === 0 ? <EmptyState title="No products match" body="Change the filters or add a product. Northside Provisions starts empty so you can see the blank workspace." action={<Button onClick={() => setOpen(true)}>Add product</Button>} /> : (
        <TableFrame>
          <thead><tr><Th>Product</Th><Th>Type</Th><Th>Status</Th><Th>SKU</Th><Th className="text-right">Price</Th><Th className="text-right">Stock</Th></tr></thead>
          <tbody>
            {rows.map((product) => {
              const stock = productStock(product, data.movements);
              const price = Math.min(...product.variants.map((variant) => variant.priceKobo));
              return (
                <tr key={product.id}>
                  <Td>
                    <Link href={`/products/${product.id}`} className="font-medium">{product.name}</Link>
                    <div className="text-xs text-muted">{categories.find((category) => category.id === product.categoryId)?.name}</div>
                  </Td>
                  <Td className="capitalize">{product.type}</Td>
                  <Td><Badge tone={product.status === "active" ? "good" : product.status === "draft" ? "warn" : "neutral"}>{product.status}</Badge></Td>
                  <Td className="font-mono text-xs">{product.variants.map((variant) => variant.sku).join(", ")}</Td>
                  <Td className="text-right tabular-nums">{formatNgn(price)}{product.variants.length > 1 ? <span className="block text-xs text-muted">from</span> : null}</Td>
                  <Td className="text-right tabular-nums">{stock === null ? "—" : stock}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableFrame>
      )}
      <div className="mt-3"><Pager page={current} pages={pages} onPage={setPage} /></div>
      <ProductDialog open={open} onOpenChange={setOpen} product={null} />
    </div>
  );
}

export function ProductDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (open: boolean) => void; product: Product | null }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const categories = byWorkspace(data.categories, data.activeWorkspaceId);
  const suppliers = byWorkspace(data.suppliers, data.activeWorkspaceId);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: product ? {
      name: product.name,
      type: product.type,
      status: product.status,
      categoryId: product.categoryId,
      supplierId: product.supplierId ?? "",
      description: product.description,
      trackStock: product.trackStock,
      variants: product.variants.map((variant) => ({ id: variant.id, name: variant.name, sku: variant.sku, barcode: variant.barcode, cost: moneyToInput(variant.costKobo), price: moneyToInput(variant.priceKobo), openingQty: "0" })),
    } : {
      name: "",
      type: "physical",
      status: "active",
      categoryId: categories[0]?.id ?? "",
      supplierId: "",
      description: "",
      trackStock: true,
      variants: [{ id: "new", name: "Default", sku: "", barcode: "", cost: "0.00", price: "0.00", openingQty: "0" }],
    },
  });
  const fields = useFieldArray({ control: form.control, name: "variants" });

  function onSubmit(values: FormValues) {
    const variants = values.variants.map((variant) => ({
      id: product ? variant.id : uid("var"),
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      costKobo: parseNairaToKobo(variant.cost) ?? 0,
      priceKobo: parseNairaToKobo(variant.price) ?? 0,
      openingQty: Number(variant.openingQty || "0"),
    }));
    const payload = {
      id: product?.id ?? uid("prd"),
      workspaceId: data.activeWorkspaceId,
      name: values.name,
      type: values.type,
      status: values.status,
      categoryId: values.categoryId,
      supplierId: values.supplierId || null,
      description: values.description,
      trackStock: values.trackStock,
      hue: product?.hue ?? 150,
      variants,
      date: todayIso(),
      historyId: uid("hist"),
      movementIds: variants.map(() => uid("mov")),
    };
    const result = product ? updateProduct(data, payload) : createProduct(data, payload);
    if (apply(result)) onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={product ? "Edit product" : "Add product"} description="Validation runs before anything is added. Opening quantity is only used for a new stock-tracked product.">
      <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Name" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type"><SelectInput {...form.register("type")}><option value="physical">Physical</option><option value="digital">Digital</option><option value="service">Service</option></SelectInput></Field>
          <Field label="Status"><SelectInput {...form.register("status")}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></SelectInput></Field>
          <Field label="Category" error={form.formState.errors.categoryId?.message}><SelectInput {...form.register("categoryId")}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectInput></Field>
          <Field label="Supplier"><SelectInput {...form.register("supplierId")}><option value="">No supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</SelectInput></Field>
        </div>
        <Field label="Description"><TextArea {...form.register("description")} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("trackStock")} /> Track stock for physical variants</label>
        <div className="grid gap-3">
          {fields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-2">
              <Field label="Variant" error={form.formState.errors.variants?.[index]?.name?.message}><TextInput {...form.register(`variants.${index}.name`)} /></Field>
              <Field label="SKU" error={form.formState.errors.variants?.[index]?.sku?.message}><TextInput {...form.register(`variants.${index}.sku`)} /></Field>
              <Field label="Barcode"><TextInput {...form.register(`variants.${index}.barcode`)} /></Field>
              <Field label="Cost (₦)" error={form.formState.errors.variants?.[index]?.cost?.message}><TextInput {...form.register(`variants.${index}.cost`)} /></Field>
              <Field label="Selling price (₦)" error={form.formState.errors.variants?.[index]?.price?.message}><TextInput {...form.register(`variants.${index}.price`)} /></Field>
              {product ? null : <Field label="Opening quantity" hint="Ignored for digital and service products." error={form.formState.errors.variants?.[index]?.openingQty?.message}><TextInput {...form.register(`variants.${index}.openingQty`)} /></Field>}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => fields.append({ id: uid("var"), name: "", sku: "", barcode: "", cost: "0.00", price: "0.00", openingQty: "0" })}>Add variant</Button>
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{product ? "Save changes" : "Create product"}</Button></div>
      </form>
    </Modal>
  );
}

export function ProductDetailScreen({ productId }: { productId: string }) {
  const data = useDemoStore((state) => state.data);
  const product = data.products.find((item) => item.id === productId && item.workspaceId === data.activeWorkspaceId);
  const [open, setOpen] = useState(false);
  if (!product) return <EmptyState title="Product not in this workspace" body="Switch workspace or return to the product list." action={<Link href="/products" className="text-sm text-accent">Back to products</Link>} />;
  const category = data.categories.find((item) => item.id === product.categoryId);
  const supplier = data.suppliers.find((item) => item.id === product.supplierId);
  const stock = productStock(product, data.movements);
  return (
    <div>
      <PageHeader title={product.name} description={`${product.type} · ${category?.name ?? "Uncategorised"} · Created ${formatDate(product.createdAt)}`} actions={<Button onClick={() => setOpen(true)}>Edit</Button>} />
      <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
        <div className="grid aspect-square place-items-center rounded-lg text-5xl font-semibold text-white" style={{ background: `hsl(${product.hue} 32% 34%)` }}>{product.name.slice(0, 1)}</div>
        <div className="grid gap-3">
          <p className="text-sm text-muted">{product.description}</p>
          <p className="text-sm">Supplier: {supplier ? <Link href={`/suppliers/${supplier.id}`} className="text-accent">{supplier.name}</Link> : "None"}</p>
          <p className="text-sm">Stock: {stock === null ? "Not tracked" : stock}</p>
          <TableFrame>
            <thead><tr><Th>Variant</Th><Th>SKU</Th><Th className="text-right">Cost</Th><Th className="text-right">Price</Th><Th className="text-right">On hand</Th></tr></thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr key={variant.id}>
                  <Td>{variant.name}</Td>
                  <Td className="font-mono text-xs">{variant.sku}</Td>
                  <Td className="text-right tabular-nums">{formatNgn(variant.costKobo)}</Td>
                  <Td className="text-right tabular-nums">{formatNgn(variant.priceKobo)}</Td>
                  <Td className="text-right tabular-nums">{product.trackStock ? data.movements.filter((movement) => movement.variantId === variant.id).reduce((sum, movement) => sum + movement.qtyDelta, 0) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        </div>
      </div>
      <h2 className="mt-6 mb-2 text-sm font-medium">History</h2>
      <ul className="grid gap-2 text-sm">
        {product.history.map((item) => <li key={item.id} className="rounded-md border border-line bg-surface px-3 py-2"><span className="text-muted">{formatDate(item.at)} · </span>{item.message}</li>)}
      </ul>
      <ProductDialog open={open} onOpenChange={setOpen} product={product} />
    </div>
  );
}
