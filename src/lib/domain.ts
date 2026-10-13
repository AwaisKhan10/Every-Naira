import { stockOf } from "@/lib/inventory";
import { nextOrderNumber, orderTotals } from "@/lib/orders";
import type { ProductCsvDraft } from "@/lib/csv";
import type {
  Channel,
  CurrencyCode,
  DemoData,
  DomainResult,
  FeeAssumption,
  FulfilmentStatus,
  MarketplaceChannel,
  MessageStatus,
  MetricKey,
  PlanId,
  ProductStatus,
  ProductType,
  Role,
  ShareKind,
} from "@/lib/types";

function ok(data: DemoData, message: string): DomainResult {
  return { ok: true, data, message };
}

function fail(error: string): DomainResult {
  return { ok: false, error };
}

function clone(data: DemoData): DemoData {
  return structuredClone(data);
}

function note(id: string, at: string, message: string) {
  return { id, at, message };
}

function remember(data: DemoData, workspaceId: string, at: string, message: string, id: string) {
  data.activity.unshift({ id, workspaceId, at, message });
}

function productOf(data: DemoData, workspaceId: string, productId: string) {
  return data.products.find((product) => product.id === productId && product.workspaceId === workspaceId) ?? null;
}

function variantOf(data: DemoData, workspaceId: string, variantId: string) {
  for (const product of data.products) {
    if (product.workspaceId !== workspaceId) continue;
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

export function setWorkspace(data: DemoData, workspaceId: string): DomainResult {
  if (!data.workspaces.some((workspace) => workspace.id === workspaceId)) return fail("That workspace is not in this demo.");
  const next = clone(data);
  next.activeWorkspaceId = workspaceId;
  return ok(next, "Workspace switched. Records stay in the browser only.");
}

export function setRole(data: DemoData, role: Role): DomainResult {
  const next = clone(data);
  next.role = role;
  return ok(next, `Demonstration role is now ${role}. This is not production security.`);
}

export function setSession(data: DemoData, name: string, email: string): DomainResult {
  if (name.trim().length < 2) return fail("Enter the name to show on the demonstration profile.");
  const next = clone(data);
  next.session = { name: name.trim(), email: email.trim() };
  return ok(next, "Demonstration profile updated. This is not an account.");
}

export function markNotificationsRead(data: DemoData, workspaceId: string): DomainResult {
  const next = clone(data);
  next.notifications.forEach((item) => {
    if (item.workspaceId === workspaceId) item.read = true;
  });
  return ok(next, "Notifications marked read in this browser.");
}

export interface VariantInput {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  costKobo: number;
  priceKobo: number;
  openingQty: number;
}

export interface ProductWrite {
  id: string;
  workspaceId: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  categoryId: string;
  supplierId: string | null;
  description: string;
  trackStock: boolean;
  hue: number;
  variants: VariantInput[];
  date: string;
  historyId: string;
  movementIds: string[];
}

function skuTaken(data: DemoData, workspaceId: string, sku: string, exceptVariantId?: string): boolean {
  const key = sku.trim().toLowerCase();
  return data.products.some((product) => product.workspaceId === workspaceId && product.variants.some((variant) => variant.sku.toLowerCase() === key && variant.id !== exceptVariantId));
}

export function createProduct(data: DemoData, input: ProductWrite): DomainResult {
  const error = validateProduct(data, input, false);
  if (error) return fail(error);
  const next = clone(data);
  next.products.unshift({
    id: input.id,
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    type: input.type,
    status: input.status,
    categoryId: input.categoryId,
    supplierId: input.supplierId,
    description: input.description.trim(),
    trackStock: input.type === "physical" ? input.trackStock : false,
    hue: input.hue,
    variants: input.variants.map((variant) => ({
      id: variant.id,
      name: variant.name.trim(),
      sku: variant.sku.trim(),
      barcode: variant.barcode.trim(),
      costKobo: variant.costKobo,
      priceKobo: variant.priceKobo,
    })),
    createdAt: input.date,
    history: [note(input.historyId, input.date, "Product created in the demonstration.")],
  });
  if (input.type === "physical" && input.trackStock) {
    input.variants.forEach((variant, index) => {
      if (variant.openingQty > 0) {
        next.movements.push({
          id: input.movementIds[index] ?? `${variant.id}_open`,
          workspaceId: input.workspaceId,
          variantId: variant.id,
          productId: input.id,
          type: "adjustment",
          qtyDelta: variant.openingQty,
          at: input.date,
          note: "Opening quantity from the product form",
          ref: input.id,
        });
      }
    });
  }
  remember(next, input.workspaceId, input.date, `Product “${input.name.trim()}” added.`, `${input.id}_act`);
  return ok(next, "Product added to the demonstration.");
}

export function updateProduct(data: DemoData, input: ProductWrite): DomainResult {
  const error = validateProduct(data, input, true);
  if (error) return fail(error);
  const next = clone(data);
  const product = productOf(next, input.workspaceId, input.id);
  if (!product) return fail("Product not found in this workspace.");
  product.name = input.name.trim();
  product.type = input.type;
  product.status = input.status;
  product.categoryId = input.categoryId;
  product.supplierId = input.supplierId;
  product.description = input.description.trim();
  product.trackStock = input.type === "physical" ? input.trackStock : false;
  product.variants = input.variants.map((variant) => ({
    id: variant.id,
    name: variant.name.trim(),
    sku: variant.sku.trim(),
    barcode: variant.barcode.trim(),
    costKobo: variant.costKobo,
    priceKobo: variant.priceKobo,
  }));
  product.history.unshift(note(input.historyId, input.date, "Product details updated. Past orders keep their original cost and price."));
  return ok(next, "Product updated.");
}

function validateProduct(data: DemoData, input: ProductWrite, editing: boolean): string | null {
  if (input.name.trim().length < 2) return "Enter a product name.";
  if (!data.categories.some((category) => category.id === input.categoryId && category.workspaceId === input.workspaceId)) return "Choose a category in this workspace.";
  if (input.supplierId && !data.suppliers.some((supplier) => supplier.id === input.supplierId && supplier.workspaceId === input.workspaceId)) return "Choose a supplier in this workspace.";
  if (input.variants.length === 0) return "Add at least one variant.";
  const seen = new Set<string>();
  for (const variant of input.variants) {
    if (variant.name.trim().length < 1) return "Each variant needs a name.";
    if (variant.sku.trim().length < 2) return "Each variant needs a SKU.";
    if (variant.costKobo < 0 || variant.priceKobo < 0) return "Cost and price cannot be negative.";
    if (!Number.isInteger(variant.openingQty) || variant.openingQty < 0) return "Opening quantity cannot be negative.";
    const key = variant.sku.trim().toLowerCase();
    if (seen.has(key)) return "Variant SKUs must be unique.";
    seen.add(key);
    if (skuTaken(data, input.workspaceId, variant.sku, editing ? variant.id : undefined)) return `SKU ${variant.sku} is already used in this workspace.`;
  }
  return null;
}

export function createSupplier(data: DemoData, input: { id: string; workspaceId: string; name: string; contactName: string; email: string; phone: string; city: string; notes: string; date: string }): DomainResult {
  if (input.name.trim().length < 2) return fail("Enter a supplier name.");
  const next = clone(data);
  next.suppliers.unshift({
    id: input.id,
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    notes: input.notes.trim(),
  });
  remember(next, input.workspaceId, input.date, `Supplier “${input.name.trim()}” added.`, `${input.id}_act`);
  return ok(next, "Supplier added.");
}

export function updateSupplier(data: DemoData, input: { id: string; workspaceId: string; name: string; contactName: string; email: string; phone: string; city: string; notes: string }): DomainResult {
  if (input.name.trim().length < 2) return fail("Enter a supplier name.");
  const next = clone(data);
  const supplier = next.suppliers.find((item) => item.id === input.id && item.workspaceId === input.workspaceId);
  if (!supplier) return fail("Supplier not found in this workspace.");
  Object.assign(supplier, { name: input.name.trim(), contactName: input.contactName.trim(), email: input.email.trim(), phone: input.phone.trim(), city: input.city.trim(), notes: input.notes.trim() });
  return ok(next, "Supplier updated.");
}

export interface PurchaseWrite {
  id: string;
  workspaceId: string;
  supplierId: string;
  reference: string;
  orderedAt: string;
  currency: CurrencyCode;
  ngnKoboPerMajor: number;
  shippingKobo: number;
  dutiesKobo: number;
  otherKobo: number;
  paidKobo: number;
  notes: string;
  lines: { id: string; variantId: string; orderedQty: number; unitMinor: number }[];
}

export function createPurchase(data: DemoData, input: PurchaseWrite): DomainResult {
  if (!data.suppliers.some((supplier) => supplier.id === input.supplierId && supplier.workspaceId === input.workspaceId)) return fail("Choose a supplier in this workspace.");
  if (input.lines.length === 0) return fail("Add a line to the purchase.");
  if (input.ngnKoboPerMajor <= 0) return fail("Enter the sample exchange rate.");
  if (input.paidKobo < 0 || input.shippingKobo < 0 || input.dutiesKobo < 0 || input.otherKobo < 0) return fail("Money fields cannot be negative.");
  const next = clone(data);
  const lines = [];
  for (const line of input.lines) {
    const found = variantOf(next, input.workspaceId, line.variantId);
    if (!found) return fail("A purchase line uses a product from another workspace.");
    if (!Number.isInteger(line.orderedQty) || line.orderedQty <= 0) return fail("Ordered quantity must be a whole number greater than zero.");
    if (line.unitMinor < 0) return fail("Purchase price cannot be negative.");
    lines.push({ id: line.id, productId: found.product.id, variantId: line.variantId, orderedQty: line.orderedQty, receivedQty: 0, unitMinor: line.unitMinor });
  }
  next.purchases.unshift({
    id: input.id,
    workspaceId: input.workspaceId,
    supplierId: input.supplierId,
    reference: input.reference.trim() || input.id,
    status: "ordered",
    orderedAt: input.orderedAt,
    currency: input.currency,
    ngnKoboPerMajor: input.ngnKoboPerMajor,
    shippingKobo: input.shippingKobo,
    dutiesKobo: input.dutiesKobo,
    otherKobo: input.otherKobo,
    paidKobo: input.paidKobo,
    notes: input.notes.trim(),
    lines,
  });
  remember(next, input.workspaceId, input.orderedAt, `Purchase ${input.reference || input.id} recorded. Stock is unchanged until you receive it.`, `${input.id}_act`);
  return ok(next, "Purchase recorded. Receive it to update stock.");
}

export function receivePurchase(data: DemoData, input: { workspaceId: string; purchaseId: string; date: string; receipts: { lineId: string; qty: number; movementId: string }[] }): DomainResult {
  const next = clone(data);
  const purchase = next.purchases.find((item) => item.id === input.purchaseId && item.workspaceId === input.workspaceId);
  if (!purchase || purchase.status === "cancelled") return fail("Purchase cannot be received.");
  let receivedAny = false;
  for (const receipt of input.receipts) {
    if (receipt.qty === 0) continue;
    if (!Number.isInteger(receipt.qty) || receipt.qty < 0) return fail("Received quantity must be a whole number.");
    const line = purchase.lines.find((item) => item.id === receipt.lineId);
    if (!line) return fail("That purchase line does not exist.");
    if (line.receivedQty + receipt.qty > line.orderedQty) return fail("You cannot receive more than the ordered quantity.");
    line.receivedQty += receipt.qty;
    const found = variantOf(next, input.workspaceId, line.variantId);
    if (!found || !found.product.trackStock) return fail("This product does not track stock.");
    next.movements.push({
      id: receipt.movementId,
      workspaceId: input.workspaceId,
      variantId: line.variantId,
      productId: line.productId,
      type: "receive",
      qtyDelta: receipt.qty,
      at: input.date,
      note: `Received ${purchase.reference}`,
      ref: purchase.reference,
    });
    receivedAny = true;
  }
  if (!receivedAny) return fail("Enter a quantity to receive.");
  const complete = purchase.lines.every((line) => line.receivedQty >= line.orderedQty);
  purchase.status = complete ? "received" : "partial";
  remember(next, input.workspaceId, input.date, `Stock received for ${purchase.reference}.`, `${input.purchaseId}_rcv_${input.date}`);
  return ok(next, complete ? "Purchase fully received." : "Partial receipt recorded.");
}

export function adjustStock(data: DemoData, input: { id: string; workspaceId: string; variantId: string; delta: number; date: string; note: string; type: "adjustment" | "return" | "stocktake"; counted?: number }): DomainResult {
  if (!input.note.trim()) return fail("Add a note so the movement can be audited in the demo.");
  const next = clone(data);
  const found = variantOf(next, input.workspaceId, input.variantId);
  if (!found || !found.product.trackStock) return fail("Choose a stock-tracked variant in this workspace.");
  const current = stockOf(next.movements.filter((movement) => movement.workspaceId === input.workspaceId), input.variantId);
  const delta = input.type === "stocktake" ? (input.counted ?? 0) - current : input.delta;
  if (!Number.isInteger(delta) || delta === 0) return fail(input.type === "stocktake" ? "Counted quantity matches the current stock." : "Enter a non-zero whole quantity.");
  if (current + delta < 0) return fail(`Only ${current} on hand. The demo will not go negative.`);
  next.movements.push({
    id: input.id,
    workspaceId: input.workspaceId,
    variantId: input.variantId,
    productId: found.product.id,
    type: input.type,
    qtyDelta: delta,
    at: input.date,
    note: input.note.trim(),
    ref: input.type,
  });
  return ok(next, "Stock movement recorded.");
}

export function createCustomer(data: DemoData, input: { id: string; workspaceId: string; name: string; email: string; phone: string; city: string; notes: string; date: string }): DomainResult {
  if (input.name.trim().length < 2) return fail("Enter the customer name.");
  const next = clone(data);
  next.customers.unshift({ id: input.id, workspaceId: input.workspaceId, name: input.name.trim(), email: input.email.trim(), phone: input.phone.trim(), city: input.city.trim(), notes: input.notes.trim(), createdAt: input.date });
  remember(next, input.workspaceId, input.date, `Customer “${input.name.trim()}” added.`, `${input.id}_act`);
  return ok(next, "Customer added. You can use them on a new order.");
}

export function updateCustomer(data: DemoData, input: { id: string; workspaceId: string; name: string; email: string; phone: string; city: string; notes: string }): DomainResult {
  if (input.name.trim().length < 2) return fail("Enter the customer name.");
  const next = clone(data);
  const customer = next.customers.find((item) => item.id === input.id && item.workspaceId === input.workspaceId);
  if (!customer) return fail("Customer not found in this workspace.");
  Object.assign(customer, { name: input.name.trim(), email: input.email.trim(), phone: input.phone.trim(), city: input.city.trim(), notes: input.notes.trim() });
  return ok(next, "Customer updated.");
}

export interface OrderLineInput {
  id: string;
  variantId: string;
  qty: number;
  unitPriceKobo: number;
  discountKobo: number;
}

export function createOrder(data: DemoData, input: { id: string; workspaceId: string; customerId: string; date: string; lines: OrderLineInput[]; discountKobo: number; deliveryFeeKobo: number; deliveryCostKobo: number; movementIds: string[]; historyId: string }): DomainResult {
  const customer = data.customers.find((item) => item.id === input.customerId && item.workspaceId === input.workspaceId);
  if (!customer) return fail("Choose a customer in this workspace.");
  if (input.lines.length === 0) return fail("Add a product to the order.");
  if (input.discountKobo < 0 || input.deliveryFeeKobo < 0 || input.deliveryCostKobo < 0) return fail("Discounts and delivery amounts cannot be negative.");
  const next = clone(data);
  const lines = [];
  let merchandise = 0;
  const demand = new Map<string, number>();
  for (const line of input.lines) {
    const found = variantOf(next, input.workspaceId, line.variantId);
    if (!found) return fail("A line uses a product from another workspace.");
    if (!Number.isInteger(line.qty) || line.qty <= 0) return fail("Quantity must be a whole number greater than zero.");
    if (line.unitPriceKobo < 0 || line.discountKobo < 0) return fail("Price and discount cannot be negative.");
    if (line.discountKobo > line.qty * line.unitPriceKobo) return fail("A line discount cannot exceed the line amount.");
    if (found.product.trackStock) demand.set(line.variantId, (demand.get(line.variantId) ?? 0) + line.qty);
    merchandise += line.qty * line.unitPriceKobo - line.discountKobo;
    lines.push({
      id: line.id,
      productId: found.product.id,
      variantId: line.variantId,
      name: found.product.name,
      variantName: found.variant.name,
      sku: found.variant.sku,
      qty: line.qty,
      unitPriceKobo: line.unitPriceKobo,
      discountKobo: line.discountKobo,
      unitCostKobo: found.variant.costKobo,
    });
  }
  if (input.discountKobo > merchandise) return fail("The order discount cannot exceed the merchandise total.");
  for (const [variantId, qty] of demand) {
    const onHand = stockOf(next.movements.filter((movement) => movement.workspaceId === input.workspaceId), variantId);
    if (qty > onHand) {
      const found = variantOf(next, input.workspaceId, variantId);
      return fail(`Only ${onHand} of ${found?.product.name ?? "that item"} (${found?.variant.name ?? variantId}) are on hand.`);
    }
  }
  const number = nextOrderNumber(next.orders.filter((order) => order.workspaceId === input.workspaceId).map((order) => order.number));
  lines.forEach((line, index) => {
    const found = variantOf(next, input.workspaceId, line.variantId);
    if (!found?.product.trackStock) return;
    next.movements.push({
      id: input.movementIds[index] ?? `${input.id}_${index}`,
      workspaceId: input.workspaceId,
      variantId: line.variantId,
      productId: line.productId,
      type: "sale",
      qtyDelta: -line.qty,
      at: input.date,
      note: `Sale ${number}`,
      ref: number,
    });
  });
  next.orders.unshift({
    id: input.id,
    workspaceId: input.workspaceId,
    number,
    customerId: input.customerId,
    createdAt: input.date,
    status: "open",
    fulfilment: "unfulfilled",
    lines,
    discountKobo: input.discountKobo,
    deliveryFeeKobo: input.deliveryFeeKobo,
    deliveryCostKobo: input.deliveryCostKobo,
    payments: [],
    refunds: [],
    stockPosted: true,
    history: [note(input.historyId, input.date, "Order created. Prices and costs were snapshotted.")],
  });
  remember(next, input.workspaceId, input.date, `${number} created for ${customer.name}.`, `${input.id}_act`);
  return ok(next, `${number} created.`);
}

export function addPayment(data: DemoData, input: { workspaceId: string; orderId: string; id: string; amountKobo: number; method: string; date: string; note: string; idempotencyKey: string }): DomainResult {
  if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) return fail("Enter a payment greater than zero.");
  const next = clone(data);
  const order = next.orders.find((item) => item.id === input.orderId && item.workspaceId === input.workspaceId);
  if (!order) return fail("Order not found in this workspace.");
  if (order.status === "cancelled") return fail("Cancelled orders cannot take payments.");
  if (order.payments.some((payment) => payment.idempotencyKey === input.idempotencyKey) || order.payments.some((payment) => payment.id === input.id)) {
    return fail("This payment was already recorded.");
  }
  const outstanding = orderTotals(order).outstandingKobo;
  if (input.amountKobo > outstanding) return fail(`The outstanding balance is only ${outstanding} kobo. The demo will not over-allocate.`);
  order.payments.push({ id: input.id, at: input.date, amountKobo: input.amountKobo, method: input.method || "Transfer", note: input.note.trim() || "Simulated payment", idempotencyKey: input.idempotencyKey });
  order.history.unshift(note(`${input.id}_h`, input.date, "Simulated payment recorded. No money moved."));
  remember(next, input.workspaceId, input.date, `Simulated payment on ${order.number}.`, `${input.id}_act`);
  return ok(next, outstanding - input.amountKobo === 0 ? "Simulated payment covers the balance." : "Simulated partial payment recorded.");
}

export function addRefund(data: DemoData, input: { workspaceId: string; orderId: string; id: string; amountKobo: number; variantId: string | null; restockQty: number; date: string; note: string; idempotencyKey: string; movementId: string }): DomainResult {
  if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) return fail("Enter a refund greater than zero.");
  if (!Number.isInteger(input.restockQty) || input.restockQty < 0) return fail("Restock quantity cannot be negative.");
  const next = clone(data);
  const order = next.orders.find((item) => item.id === input.orderId && item.workspaceId === input.workspaceId);
  if (!order || order.status === "cancelled") return fail("That order cannot be refunded.");
  if (order.refunds.some((refund) => refund.idempotencyKey === input.idempotencyKey)) return fail("This refund was already recorded.");
  const totals = orderTotals(order);
  if (input.amountKobo > totals.netPaidKobo) return fail("Refund cannot exceed the net amount paid.");
  let unitCost = 0;
  if (input.restockQty > 0) {
    if (!input.variantId) return fail("Choose the variant to restock.");
    const line = order.lines.find((item) => item.variantId === input.variantId);
    if (!line) return fail("That variant is not on the order.");
    const already = order.refunds.filter((refund) => refund.variantId === input.variantId).reduce((sum, refund) => sum + refund.restockQty, 0);
    if (input.restockQty + already > line.qty) return fail("You cannot restock more than were sold on this order.");
    unitCost = line.unitCostKobo;
    next.movements.push({
      id: input.movementId,
      workspaceId: input.workspaceId,
      variantId: input.variantId,
      productId: line.productId,
      type: "return",
      qtyDelta: input.restockQty,
      at: input.date,
      note: `Return on ${order.number}`,
      ref: order.number,
    });
  }
  order.refunds.push({ id: input.id, at: input.date, amountKobo: input.amountKobo, variantId: input.variantId, restockQty: input.restockQty, unitCostKobo: unitCost, note: input.note.trim() || "Simulated refund", idempotencyKey: input.idempotencyKey });
  order.history.unshift(note(`${input.id}_h`, input.date, "Simulated refund recorded. No money was returned by a provider."));
  if (input.restockQty > 0) order.fulfilment = "returned";
  remember(next, input.workspaceId, input.date, `Simulated refund on ${order.number}.`, `${input.id}_act`);
  return ok(next, "Simulated refund recorded.");
}

const FULFILMENT_FLOW: FulfilmentStatus[] = ["unfulfilled", "packing", "shipped", "delivered", "returned"];

export function setFulfilment(data: DemoData, input: { workspaceId: string; orderId: string; fulfilment: FulfilmentStatus; date: string; historyId: string }): DomainResult {
  const next = clone(data);
  const order = next.orders.find((item) => item.id === input.orderId && item.workspaceId === input.workspaceId);
  if (!order || order.status === "cancelled") return fail("That order cannot change fulfilment.");
  const from = FULFILMENT_FLOW.indexOf(order.fulfilment);
  const to = FULFILMENT_FLOW.indexOf(input.fulfilment);
  if (to < 0 || to < from) return fail("That fulfilment step is not available from the current state.");
  order.fulfilment = input.fulfilment;
  order.history.unshift(note(input.historyId, input.date, `Fulfilment set to ${input.fulfilment}.`));
  return ok(next, "Fulfilment updated.");
}

export function cancelOrder(data: DemoData, input: { workspaceId: string; orderId: string; date: string; historyId: string; movementIds: string[] }): DomainResult {
  const next = clone(data);
  const order = next.orders.find((item) => item.id === input.orderId && item.workspaceId === input.workspaceId);
  if (!order) return fail("Order not found.");
  if (order.status === "cancelled") return fail("The order is already cancelled.");
  if (order.fulfilment !== "unfulfilled" && order.fulfilment !== "packing") return fail("Only unfulfilled or packing orders can be cancelled.");
  if (orderTotals(order).netPaidKobo > 0) return fail("Refund the simulated payment before cancelling.");
  if (order.stockPosted) {
    order.lines.forEach((line, index) => {
      const found = variantOf(next, input.workspaceId, line.variantId);
      if (!found?.product.trackStock) return;
      next.movements.push({
        id: input.movementIds[index] ?? `${input.historyId}_${index}`,
        workspaceId: input.workspaceId,
        variantId: line.variantId,
        productId: line.productId,
        type: "reversal",
        qtyDelta: line.qty,
        at: input.date,
        note: `Cancelled ${order.number}`,
        ref: order.number,
      });
    });
  }
  order.status = "cancelled";
  order.stockPosted = false;
  order.history.unshift(note(input.historyId, input.date, "Order cancelled and stock reversed where it had been posted."));
  remember(next, input.workspaceId, input.date, `${order.number} cancelled.`, `${input.orderId}_cancel`);
  return ok(next, "Order cancelled.");
}

export function updateFee(data: DemoData, input: { workspaceId: string; channel: MarketplaceChannel; commissionBps: number; marketplaceBps: number; paymentBps: number; fulfilmentKobo: number; otherKobo: number; date: string }): DomainResult {
  const values = [input.commissionBps, input.marketplaceBps, input.paymentBps];
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 10_000)) return fail("Percentage fees must be between 0% and 100%.");
  if (input.fulfilmentKobo < 0 || input.otherKobo < 0) return fail("Fixed fees cannot be negative.");
  const next = clone(data);
  const fee = next.fees.find((item) => item.workspaceId === input.workspaceId && item.channel === input.channel);
  const patch: Omit<FeeAssumption, "id" | "workspaceId" | "channel"> = {
    commissionBps: input.commissionBps,
    marketplaceBps: input.marketplaceBps,
    paymentBps: input.paymentBps,
    fulfilmentKobo: input.fulfilmentKobo,
    otherKobo: input.otherKobo,
    updatedAt: input.date,
  };
  if (fee) Object.assign(fee, patch);
  else next.fees.push({ id: `fee_${input.channel}_${input.workspaceId}`, workspaceId: input.workspaceId, channel: input.channel, ...patch });
  return ok(next, "Illustrative fee assumptions saved in this browser.");
}

export function applyPrices(data: DemoData, input: { workspaceId: string; date: string; changes: { variantId: string; priceKobo: number; historyId: string }[]; note: string }): DomainResult {
  if (input.changes.length === 0) return fail("There are no price changes to apply.");
  const next = clone(data);
  for (const change of input.changes) {
    if (change.priceKobo < 0) return fail("A selling price cannot be negative.");
    const found = variantOf(next, input.workspaceId, change.variantId);
    if (!found) return fail("A selected variant is not in this workspace.");
    if (found.variant.priceKobo === change.priceKobo) continue;
    next.priceChanges.unshift({ id: change.historyId, workspaceId: input.workspaceId, variantId: change.variantId, at: input.date, oldPriceKobo: found.variant.priceKobo, newPriceKobo: change.priceKobo, note: input.note.trim() || "Bulk price update" });
    found.product.history.unshift(note(`${change.historyId}_p`, input.date, `Price for ${found.variant.name} changed. Earlier orders are unchanged.`));
    found.variant.priceKobo = change.priceKobo;
  }
  return ok(next, "Prices updated. Existing orders still use their snapshotted prices.");
}

export function saveScenario(data: DemoData, input: { id: string; workspaceId: string; name: string; variantId: string; priceKobo: number; note: string; date: string }): DomainResult {
  if (input.name.trim().length < 2) return fail("Name the scenario.");
  if (!variantOf(data, input.workspaceId, input.variantId)) return fail("Choose a variant in this workspace.");
  if (input.priceKobo < 0) return fail("Scenario price cannot be negative.");
  const next = clone(data);
  next.scenarios.unshift({ id: input.id, workspaceId: input.workspaceId, name: input.name.trim(), variantId: input.variantId, priceKobo: input.priceKobo, note: input.note.trim(), createdAt: input.date });
  return ok(next, "Scenario saved in this browser.");
}

export function saveGoal(data: DemoData, input: { id?: string; workspaceId: string; title: string; metric: MetricKey; target: number; deadline: string; notes: string }): DomainResult {
  if (input.title.trim().length < 2) return fail("Name the goal.");
  if (!Number.isInteger(input.target) || input.target <= 0) return fail("Enter a target greater than zero.");
  const next = clone(data);
  const existing = input.id ? next.goals.find((item) => item.id === input.id && item.workspaceId === input.workspaceId) : undefined;
  if (input.id && existing) {
    Object.assign(existing, { title: input.title.trim(), metric: input.metric, target: input.target, deadline: input.deadline, notes: input.notes.trim() });
    return ok(next, "Goal updated.");
  }
  const id = input.id ?? `goal_${input.workspaceId}_${next.goals.length}`;
  next.goals.unshift({ id, workspaceId: input.workspaceId, title: input.title.trim(), metric: input.metric, target: input.target, deadline: input.deadline, notes: input.notes.trim() });
  return ok(next, "Goal added.");
}

export function saveTask(data: DemoData, input: { id: string; workspaceId: string; title: string; due: string; notes: string }): DomainResult {
  if (input.title.trim().length < 2) return fail("Name the task.");
  const next = clone(data);
  next.tasks.unshift({ id: input.id, workspaceId: input.workspaceId, title: input.title.trim(), due: input.due, done: false, notes: input.notes.trim() });
  return ok(next, "Task added.");
}

export function toggleTask(data: DemoData, input: { workspaceId: string; taskId: string }): DomainResult {
  const next = clone(data);
  const task = next.tasks.find((item) => item.id === input.taskId && item.workspaceId === input.workspaceId);
  if (!task) return fail("Task not found.");
  task.done = !task.done;
  return ok(next, task.done ? "Task completed." : "Task reopened.");
}

export function createMessage(data: DemoData, input: { id: string; workspaceId: string; channel: Channel; customerId: string | null; recipient: string; subject: string; body: string; date: string }): DomainResult {
  if (input.body.trim().length < 2) return fail("Write a message before saving the preview.");
  if (input.recipient.trim().length < 2) return fail("Choose a recipient.");
  const next = clone(data);
  next.messages.unshift({ id: input.id, workspaceId: input.workspaceId, channel: input.channel, customerId: input.customerId, recipient: input.recipient.trim(), subject: input.subject.trim(), body: input.body.trim(), status: "draft", at: input.date, failureReason: "" });
  return ok(next, "Draft saved. Nothing was sent.");
}

export function setMessageStatus(data: DemoData, input: { workspaceId: string; messageId: string; status: MessageStatus }): DomainResult {
  const next = clone(data);
  const message = next.messages.find((item) => item.id === input.messageId && item.workspaceId === input.workspaceId);
  if (!message) return fail("Message not found.");
  if (input.status === "simulated_queued" && message.status === "simulated_queued") return fail("It is already in the simulated queue.");
  message.status = input.status;
  message.failureReason = input.status === "simulated_failed" ? "Demo mode cannot reach a provider." : "";
  const label = input.status === "simulated_queued" ? "Moved to the simulated queue. Nothing left this browser." : input.status === "simulated_failed" ? "Marked as a simulated failure." : "Returned to draft.";
  return ok(next, label);
}

export function saveProject(data: DemoData, input: { id: string; workspaceId: string; name: string; status: DemoData["projects"][number]["status"]; concept: string; materials: string; measurements: string; components: string; supplierNotes: string; estimatedCostKobo: number; specs: string; date: string }): DomainResult {
  if (input.name.trim().length < 2) return fail("Name the development project.");
  if (input.estimatedCostKobo < 0) return fail("Estimated cost cannot be negative.");
  const next = clone(data);
  const existing = next.projects.find((project) => project.id === input.id && project.workspaceId === input.workspaceId);
  const record = {
    id: input.id,
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    status: input.status,
    concept: input.concept.trim(),
    materials: input.materials.trim(),
    measurements: input.measurements.trim(),
    components: input.components.trim(),
    supplierNotes: input.supplierNotes.trim(),
    estimatedCostKobo: input.estimatedCostKobo,
    specs: input.specs.trim(),
    updatedAt: input.date,
  };
  if (existing) Object.assign(existing, record);
  else next.projects.unshift(record);
  return ok(next, "Development record saved in this browser.");
}

export function createShare(data: DemoData, input: { token: string; workspaceId: string; kind: ShareKind; recordId: string; date: string }): DomainResult {
  const next = clone(data);
  next.shares.unshift({ token: input.token, workspaceId: input.workspaceId, kind: input.kind, recordId: input.recordId, createdAt: input.date });
  return ok(next, "Local preview link created. It only works in this browser.");
}

export function importProducts(data: DemoData, input: { workspaceId: string; date: string; drafts: ProductCsvDraft[]; ids: { productId: string; variantId: string; movementId: string; historyId: string }[] }): DomainResult {
  if (input.drafts.length === 0) return fail("There are no valid rows to import.");
  let next = data;
  for (let index = 0; index < input.drafts.length; index += 1) {
    const draft = input.drafts[index];
    const ids = input.ids[index];
    if (!draft || !ids) return fail("Import ids are missing.");
    let category = next.categories.find((item) => item.workspaceId === input.workspaceId && item.name.toLowerCase() === draft.category.toLowerCase());
    if (!category) {
      const created = clone(next);
      category = { id: `cat_${ids.productId}`, workspaceId: input.workspaceId, name: draft.category };
      created.categories.push(category);
      next = created;
    }
    const result = createProduct(next, {
      id: ids.productId,
      workspaceId: input.workspaceId,
      name: draft.name,
      type: draft.type,
      status: "active",
      categoryId: category.id,
      supplierId: null,
      description: draft.description,
      trackStock: draft.type === "physical",
      hue: 140 + (index * 30) % 180,
      date: input.date,
      historyId: ids.historyId,
      movementIds: [ids.movementId],
      variants: [{ id: ids.variantId, name: "Default", sku: draft.sku, barcode: draft.barcode, costKobo: draft.costKobo, priceKobo: draft.priceKobo, openingQty: draft.stock ?? 0 }],
    });
    if (!result.ok) return result;
    next = result.data;
  }
  return ok(next, `${input.drafts.length} product${input.drafts.length === 1 ? "" : "s"} imported into the demonstration.`);
}

export function setLowStockAt(data: DemoData, workspaceId: string, lowStockAt: number): DomainResult {
  if (!Number.isInteger(lowStockAt) || lowStockAt < 0 || lowStockAt > 10_000) return fail("Enter a low-stock threshold between 0 and 10,000.");
  const next = clone(data);
  const workspace = next.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return fail("Workspace not found.");
  workspace.lowStockAt = lowStockAt;
  return ok(next, "Low-stock threshold updated for this demonstration workspace.");
}

export function setPlan(data: DemoData, input: { planId: PlanId; invoice: DemoData["billing"]["invoices"][number] | null }): DomainResult {
  const next = clone(data);
  next.billing.planId = input.planId;
  if (input.invoice) next.billing.invoices.unshift(input.invoice);
  return ok(next, "Demonstration plan updated. No subscription was charged.");
}

export function addSupportNote(data: DemoData, noteInput: DemoData["supportNotes"][number]): DomainResult {
  if (noteInput.message.trim().length < 8) return fail("Write a short message so the demo can store it.");
  const next = clone(data);
  next.supportNotes.unshift({ ...noteInput, name: noteInput.name.trim(), email: noteInput.email.trim(), topic: noteInput.topic.trim(), message: noteInput.message.trim() });
  return ok(next, "Saved in this browser only. Nobody was contacted.");
}

export function saveIntegrationNote(data: DemoData, provider: string, notes: string): DomainResult {
  const next = clone(data);
  next.integrationNotes[provider] = notes.trim();
  return ok(next, "Notes saved in this browser. The provider is still not connected.");
}

export function applyUnitCost(data: DemoData, input: { workspaceId: string; variantId: string; costKobo: number; date: string; historyId: string }): DomainResult {
  if (input.costKobo < 0) return fail("Unit cost cannot be negative.");
  const next = clone(data);
  const found = variantOf(next, input.workspaceId, input.variantId);
  if (!found) return fail("Variant not found in this workspace.");
  found.variant.costKobo = input.costKobo;
  found.product.history.unshift(note(input.historyId, input.date, "Current unit cost updated. Past order costs were not rewritten."));
  return ok(next, "Current unit cost updated. Historical orders are unchanged.");
}
