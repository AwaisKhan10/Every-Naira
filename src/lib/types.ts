export type ProductType = "physical" | "digital" | "service";
export type ProductStatus = "active" | "draft" | "archived";
export type FulfilmentStatus = "unfulfilled" | "packing" | "shipped" | "delivered" | "returned";
export type OrderStatus = "open" | "cancelled";
export type PurchaseStatus = "ordered" | "partial" | "received" | "cancelled";
export type MovementType = "receive" | "sale" | "return" | "adjustment" | "stocktake" | "reversal";
export type Role = "owner" | "staff" | "admin";
export type Channel = "whatsapp" | "email";
export type MessageStatus = "draft" | "simulated_queued" | "simulated_failed";
export type CurrencyCode = "NGN" | "USD" | "GBP" | "EUR" | "CNY";
export type MetricKey = "sales" | "profit" | "orders";
export type RangeKey = "7d" | "30d" | "90d" | "all";
export type PlanId = "starter" | "growth" | "scale";
export type ShareKind = "invoice" | "receipt" | "statement" | "packing" | "techpack" | "labels";
export type MarketplaceChannel = "direct" | "jumia" | "konga";

export interface HistoryNote {
  id: string;
  at: string;
  message: string;
}

export interface Workspace {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  lowStockAt: number;
}

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  costKobo: number;
  priceKobo: number;
}

export interface Product {
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
  variants: Variant[];
  createdAt: string;
  history: HistoryNote[];
}

export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
}

export interface PurchaseLine {
  id: string;
  productId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
  /** Minor units of the purchase currency (kobo or cents). */
  unitMinor: number;
}

export interface Purchase {
  id: string;
  workspaceId: string;
  supplierId: string;
  reference: string;
  status: PurchaseStatus;
  orderedAt: string;
  currency: CurrencyCode;
  /**
   * Sample conversion: kobo per 1 major unit of `currency`.
   * NGN uses 100. A sample of ₦1,550 per $1 is stored as 155000.
   * This is not a live exchange rate.
   */
  ngnKoboPerMajor: number;
  shippingKobo: number;
  dutiesKobo: number;
  otherKobo: number;
  paidKobo: number;
  lines: PurchaseLine[];
  notes: string;
}

export interface Movement {
  id: string;
  workspaceId: string;
  variantId: string;
  productId: string;
  type: MovementType;
  qtyDelta: number;
  at: string;
  note: string;
  ref: string;
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  createdAt: string;
}

export interface OrderLine {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  sku: string;
  qty: number;
  unitPriceKobo: number;
  discountKobo: number;
  unitCostKobo: number;
}

export interface Payment {
  id: string;
  at: string;
  amountKobo: number;
  method: string;
  note: string;
  idempotencyKey: string;
}

export interface Refund {
  id: string;
  at: string;
  amountKobo: number;
  variantId: string | null;
  restockQty: number;
  unitCostKobo: number;
  note: string;
  idempotencyKey: string;
}

export interface Order {
  id: string;
  workspaceId: string;
  number: string;
  customerId: string;
  createdAt: string;
  status: OrderStatus;
  fulfilment: FulfilmentStatus;
  lines: OrderLine[];
  discountKobo: number;
  deliveryFeeKobo: number;
  deliveryCostKobo: number;
  payments: Payment[];
  refunds: Refund[];
  stockPosted: boolean;
  history: HistoryNote[];
}

export interface Expense {
  id: string;
  workspaceId: string;
  at: string;
  category: string;
  amountKobo: number;
  note: string;
}

export interface FeeAssumption {
  id: string;
  workspaceId: string;
  channel: MarketplaceChannel;
  commissionBps: number;
  marketplaceBps: number;
  paymentBps: number;
  fulfilmentKobo: number;
  otherKobo: number;
  updatedAt: string;
}

export interface PriceChange {
  id: string;
  workspaceId: string;
  variantId: string;
  at: string;
  oldPriceKobo: number;
  newPriceKobo: number;
  note: string;
}

export interface PricingScenario {
  id: string;
  workspaceId: string;
  name: string;
  variantId: string;
  priceKobo: number;
  note: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  workspaceId: string;
  title: string;
  metric: MetricKey;
  target: number;
  deadline: string;
  notes: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  due: string;
  done: boolean;
  notes: string;
}

export interface Template {
  id: string;
  workspaceId: string;
  channel: Channel;
  name: string;
  subject: string;
  body: string;
}

export interface DemoMessage {
  id: string;
  workspaceId: string;
  channel: Channel;
  customerId: string | null;
  recipient: string;
  subject: string;
  body: string;
  status: MessageStatus;
  at: string;
  failureReason: string;
}

export interface DevProject {
  id: string;
  workspaceId: string;
  name: string;
  status: "concept" | "sampling" | "costing" | "ready";
  concept: string;
  materials: string;
  measurements: string;
  components: string;
  supplierNotes: string;
  estimatedCostKobo: number;
  specs: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  workspaceId: string;
  at: string;
  message: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
}

export interface ShareLink {
  token: string;
  workspaceId: string;
  kind: ShareKind;
  recordId: string;
  createdAt: string;
}

export interface BillingInvoice {
  id: string;
  at: string;
  description: string;
  amountKobo: number;
  state: "simulated_paid" | "simulated_failed" | "simulated_cancelled";
}

export interface SupportNote {
  id: string;
  at: string;
  name: string;
  email: string;
  topic: string;
  message: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
}

export interface DemoData {
  version: 1;
  activeWorkspaceId: string;
  role: Role;
  session: { name: string; email: string };
  workspaces: Workspace[];
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  movements: Movement[];
  customers: Customer[];
  orders: Order[];
  expenses: Expense[];
  fees: FeeAssumption[];
  priceChanges: PriceChange[];
  scenarios: PricingScenario[];
  goals: Goal[];
  tasks: Task[];
  templates: Template[];
  messages: DemoMessage[];
  projects: DevProject[];
  activity: Activity[];
  notifications: Notification[];
  shares: ShareLink[];
  billing: { planId: PlanId; invoices: BillingInvoice[] };
  supportNotes: SupportNote[];
  users: DemoUser[];
  integrationNotes: Record<string, string>;
}

export interface OrderTotals {
  merchandiseKobo: number;
  totalKobo: number;
  paidKobo: number;
  refundedKobo: number;
  netPaidKobo: number;
  outstandingKobo: number;
  cogsKobo: number;
  restockedCogsKobo: number;
  deliveryFeeKobo: number;
  deliveryCostKobo: number;
}

export type DomainResult =
  | { ok: true; data: DemoData; message: string }
  | { ok: false; error: string };
