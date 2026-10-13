import type { DemoData } from "@/lib/types";

const WS = "ws_adaeze";
const WS2 = "ws_northside";

function categories(workspaceId: string, suffix: string) {
  return [
    { id: `cat_apparel_${suffix}`, workspaceId, name: "Apparel" },
    { id: `cat_footwear_${suffix}`, workspaceId, name: "Footwear" },
    { id: `cat_beauty_${suffix}`, workspaceId, name: "Beauty" },
    { id: `cat_accessories_${suffix}`, workspaceId, name: "Accessories" },
    { id: `cat_digital_${suffix}`, workspaceId, name: "Digital" },
    { id: `cat_service_${suffix}`, workspaceId, name: "Services" },
  ];
}

export const DEMO_ANCHOR = "2026-10-13";

export function createSeed(): DemoData {
  return {
    version: 1,
    activeWorkspaceId: WS,
    role: "owner",
    session: { name: "Adaeze Okonkwo", email: "adaeze@adaeze.example" },
    workspaces: [
      {
        id: WS,
        name: "Adaeze Collective",
        city: "Lagos",
        address: "12 Allen Avenue, Ikeja, Lagos",
        phone: "0803 000 0010",
        email: "hello@adaeze.example",
        lowStockAt: 3,
      },
      {
        id: WS2,
        name: "Northside Provisions",
        city: "Kaduna",
        address: "4 Ahmadu Bello Way, Kaduna",
        phone: "0803 000 0020",
        email: "hello@northside.example",
        lowStockAt: 3,
      },
    ],
    categories: [...categories(WS, "a"), ...categories(WS2, "b")],
    suppliers: [
      { id: "s_kano", workspaceId: WS, name: "Kano Textile Mill", contactName: "Amina Yusuf", email: "amina@kano-textile.example", phone: "0803 000 0101", city: "Kano", notes: "Ankara and woven cotton. Lead time about 10 days in this sample." },
      { id: "s_leather", workspaceId: WS, name: "Lagos Leather Co.", contactName: "Chinedu Obi", email: "chinedu@lagos-leather.example", phone: "0803 000 0102", city: "Lagos", notes: "Sandals invoiced in a sample USD price. Rate is entered manually." },
      { id: "s_botanics", workspaceId: WS, name: "Ibadan Botanics", contactName: "Seyi Adewale", email: "seyi@ibadan-botanics.example", phone: "0803 000 0103", city: "Ibadan", notes: "Shea balm in 200ml jars." },
      { id: "s_metal", workspaceId: WS, name: "Ilorin Metalworks", contactName: "Bilal Sanni", email: "bilal@ilorin-metal.example", phone: "0803 000 0104", city: "Ilorin", notes: "Small brass accessories." },
    ],
    products: [
      product("p_ankara", "Ankara Wrap Dress", "physical", "active", "cat_apparel_a", "s_kano", "Cotton ankara wrap, lined bodice.", true, 152, "2026-09-20", [
        variant("v_ankara_m", "Indigo / M", "ANK-IND-M", "6154001000011", 800_000, 1_850_000),
        variant("v_ankara_l", "Gold / L", "ANK-GLD-L", "6154001000012", 800_000, 1_850_000),
      ], "Unit cost set from purchase batch PO-2401."),
      product("p_sandals", "Leather Cross Sandal", "physical", "active", "cat_footwear_a", "s_leather", "Vegetable-tanned cross sandal.", true, 28, "2026-09-18", [
        variant("v_san_39", "Size 39", "SAN-39", "6154001000021", 770_000, 1_450_000),
        variant("v_san_42", "Size 42", "SAN-42", "6154001000022", 770_000, 1_450_000),
      ], "Unit cost includes the sample freight and duty on PO-2402."),
      product("p_shea", "Shea Body Balm 200ml", "physical", "active", "cat_beauty_a", "s_botanics", "Unscented shea balm.", true, 92, "2026-09-12", [
        variant("v_shea", "200ml", "SHEA-200", "6154001000031", 180_000, 450_000),
      ], "Unit cost set from purchase batch PO-2403."),
      product("p_ear", "Brass Drop Earrings", "physical", "active", "cat_accessories_a", "s_metal", "Lightweight brass drop, gold tone.", true, 42, "2026-09-22", [
        variant("v_ear", "Gold", "EAR-GLD", "6154001000041", 220_000, 650_000),
      ], "Low stock after the 9 Oct sale."),
      product("p_guide", "Trader Books Digital Guide", "digital", "active", "cat_digital_a", null, "Downloadable bookkeeping guide for market traders.", false, 210, "2026-08-02", [
        variant("v_guide", "PDF", "GUIDE-PDF", "6154001000051", 0, 750_000),
      ], "No stock tracking. Unit cost is zero in this sample."),
      product("p_tailor", "Bespoke Tailoring Session", "service", "active", "cat_service_a", null, "Half-day fitting and sewing session.", false, 262, "2026-08-15", [
        variant("v_tailor", "Half day", "SEW-HALF", "6154001000061", 800_000, 2_500_000),
      ], "Cost is an internal labour estimate, not a supplier invoice."),
    ],
    purchases: [
      {
        id: "pu1",
        workspaceId: WS,
        supplierId: "s_kano",
        reference: "PO-2401",
        status: "received",
        orderedAt: "2026-09-20",
        currency: "NGN",
        ngnKoboPerMajor: 100,
        shippingKobo: 2_200_000,
        dutiesKobo: 0,
        otherKobo: 600_000,
        paidKobo: 22_400_000,
        notes: "Fully received. Sample naira purchase.",
        lines: [
          { id: "pl1", productId: "p_ankara", variantId: "v_ankara_m", orderedQty: 18, receivedQty: 18, unitMinor: 700_000 },
          { id: "pl2", productId: "p_ankara", variantId: "v_ankara_l", orderedQty: 10, receivedQty: 10, unitMinor: 700_000 },
        ],
      },
      {
        id: "pu2",
        workspaceId: WS,
        supplierId: "s_leather",
        reference: "PO-2402",
        status: "partial",
        orderedAt: "2026-09-18",
        currency: "USD",
        ngnKoboPerMajor: 155_000,
        shippingKobo: 2_200_000,
        dutiesKobo: 800_000,
        otherKobo: 0,
        paidKobo: 10_000_000,
        notes: "Sample rate of ₦1,550 per $1. Not a live market rate. Eight size-42 pairs are still outstanding.",
        lines: [
          { id: "pl3", productId: "p_sandals", variantId: "v_san_39", orderedQty: 12, receivedQty: 12, unitMinor: 400 },
          { id: "pl4", productId: "p_sandals", variantId: "v_san_42", orderedQty: 8, receivedQty: 3, unitMinor: 400 },
        ],
      },
      {
        id: "pu3",
        workspaceId: WS,
        supplierId: "s_botanics",
        reference: "PO-2403",
        status: "received",
        orderedAt: "2026-09-12",
        currency: "NGN",
        ngnKoboPerMajor: 100,
        shippingKobo: 1_200_000,
        dutiesKobo: 0,
        otherKobo: 0,
        paidKobo: 7_200_000,
        notes: "Fully received.",
        lines: [{ id: "pl5", productId: "p_shea", variantId: "v_shea", orderedQty: 40, receivedQty: 40, unitMinor: 150_000 }],
      },
      {
        id: "pu4",
        workspaceId: WS,
        supplierId: "s_metal",
        reference: "PO-2404",
        status: "received",
        orderedAt: "2026-09-22",
        currency: "NGN",
        ngnKoboPerMajor: 100,
        shippingKobo: 160_000,
        dutiesKobo: 0,
        otherKobo: 0,
        paidKobo: 880_000,
        notes: "Fully received.",
        lines: [{ id: "pl6", productId: "p_ear", variantId: "v_ear", orderedQty: 4, receivedQty: 4, unitMinor: 180_000 }],
      },
    ],
    movements: [
      move("m1", "v_ankara_m", "p_ankara", "receive", 18, "2026-09-20", "Received PO-2401", "PO-2401"),
      move("m2", "v_ankara_l", "p_ankara", "receive", 10, "2026-09-20", "Received PO-2401", "PO-2401"),
      move("m3", "v_san_39", "p_sandals", "receive", 12, "2026-09-18", "Received PO-2402", "PO-2402"),
      move("m4", "v_san_42", "p_sandals", "receive", 3, "2026-09-18", "Partial receipt PO-2402", "PO-2402"),
      move("m5", "v_shea", "p_shea", "receive", 40, "2026-09-12", "Received PO-2403", "PO-2403"),
      move("m6", "v_ear", "p_ear", "receive", 4, "2026-09-22", "Received PO-2404", "PO-2404"),
      move("m7", "v_ankara_l", "p_ankara", "sale", -1, "2026-10-02", "Sale ORD-1046", "ORD-1046"),
      move("m8", "v_san_42", "p_sandals", "sale", -1, "2026-10-02", "Sale ORD-1046", "ORD-1046"),
      move("m9", "v_shea", "p_shea", "sale", -3, "2026-10-05", "Sale ORD-1047", "ORD-1047"),
      move("m10", "v_ear", "p_ear", "sale", -3, "2026-10-09", "Sale ORD-1052", "ORD-1052"),
      move("m11", "v_ankara_m", "p_ankara", "sale", -1, "2026-10-11", "Sale ORD-1048", "ORD-1048"),
      move("m12", "v_shea", "p_shea", "sale", -1, "2026-10-11", "Sale ORD-1048", "ORD-1048"),
      move("m13", "v_san_39", "p_sandals", "sale", -2, "2026-10-12", "Sale ORD-1049", "ORD-1049"),
    ],
    customers: [
      { id: "c1", workspaceId: WS, name: "Chioma Adeyemi", email: "chioma@example.com", phone: "0803 000 0201", city: "Lagos", notes: "Prefers WhatsApp updates. Sample contact only.", createdAt: "2026-08-01" },
      { id: "c2", workspaceId: WS, name: "Tunde Bakare", email: "tunde@example.com", phone: "0803 000 0202", city: "Abuja", notes: "Collects from a rider in Wuse.", createdAt: "2026-08-04" },
      { id: "c3", workspaceId: WS, name: "Ngozi Okonkwo", email: "ngozi@example.com", phone: "0803 000 0203", city: "Enugu", notes: "Bought the digital guide.", createdAt: "2026-08-11" },
      { id: "c4", workspaceId: WS, name: "Emeka Nwosu", email: "emeka@example.com", phone: "0803 000 0204", city: "Port Harcourt", notes: "Repeat apparel customer.", createdAt: "2026-09-02" },
      { id: "c5", workspaceId: WS, name: "Fatima Bello", email: "fatima@example.com", phone: "0803 000 0205", city: "Kano", notes: "Buys balm in small sets.", createdAt: "2026-09-14" },
    ],
    orders: [
      order("o5", "ORD-1046", "c4", "2026-10-02", "delivered", 0, 150_000, 100_000, [
        line("ol5a", "p_ankara", "v_ankara_l", "Ankara Wrap Dress", "Gold / L", "ANK-GLD-L", 1, 1_850_000, 0, 800_000),
        line("ol5b", "p_sandals", "v_san_42", "Leather Cross Sandal", "Size 42", "SAN-42", 1, 1_450_000, 0, 770_000),
      ], [{ id: "pay5", at: "2026-10-02", amountKobo: 3_450_000, method: "Transfer", note: "Simulated full payment", idempotencyKey: "pay5" }]),
      order("o6", "ORD-1047", "c5", "2026-10-05", "delivered", 50_000, 100_000, 80_000, [
        line("ol6", "p_shea", "v_shea", "Shea Body Balm 200ml", "200ml", "SHEA-200", 3, 450_000, 0, 180_000),
      ], [{ id: "pay6", at: "2026-10-05", amountKobo: 1_400_000, method: "Card", note: "Simulated full payment", idempotencyKey: "pay6" }]),
      order("o3", "ORD-1050", "c3", "2026-10-08", "delivered", 0, 0, 0, [
        line("ol3", "p_guide", "v_guide", "Trader Books Digital Guide", "PDF", "GUIDE-PDF", 1, 750_000, 0, 0),
      ], [{ id: "pay3", at: "2026-10-08", amountKobo: 750_000, method: "Transfer", note: "Simulated full payment", idempotencyKey: "pay3" }]),
      order("o8", "ORD-1052", "c5", "2026-10-09", "delivered", 0, 0, 0, [
        line("ol8", "p_ear", "v_ear", "Brass Drop Earrings", "Gold", "EAR-GLD", 3, 650_000, 0, 220_000),
      ], [{ id: "pay8", at: "2026-10-09", amountKobo: 1_950_000, method: "Transfer", note: "Simulated full payment", idempotencyKey: "pay8" }]),
      order("o1", "ORD-1048", "c1", "2026-10-11", "delivered", 0, 150_000, 90_000, [
        line("ol1a", "p_ankara", "v_ankara_m", "Ankara Wrap Dress", "Indigo / M", "ANK-IND-M", 1, 1_850_000, 0, 800_000),
        line("ol1b", "p_shea", "v_shea", "Shea Body Balm 200ml", "200ml", "SHEA-200", 1, 450_000, 0, 180_000),
      ], [{ id: "pay1", at: "2026-10-11", amountKobo: 2_450_000, method: "Transfer", note: "Simulated full payment", idempotencyKey: "pay1" }]),
      order("o2", "ORD-1049", "c2", "2026-10-12", "packing", 0, 200_000, 120_000, [
        line("ol2", "p_sandals", "v_san_39", "Leather Cross Sandal", "Size 39", "SAN-39", 2, 1_450_000, 0, 770_000),
      ], [{ id: "pay2", at: "2026-10-12", amountKobo: 1_500_000, method: "Transfer", note: "Simulated partial payment", idempotencyKey: "pay2" }]),
      order("o4", "ORD-1051", "c1", "2026-10-13", "unfulfilled", 200_000, 0, 0, [
        line("ol4", "p_tailor", "v_tailor", "Bespoke Tailoring Session", "Half day", "SEW-HALF", 1, 2_500_000, 0, 800_000),
      ], []),
      {
        ...order("o7", "ORD-1044", "c2", "2026-09-28", "unfulfilled", 0, 0, 0, [
          line("ol7", "p_sandals", "v_san_39", "Leather Cross Sandal", "Size 39", "SAN-39", 1, 1_450_000, 0, 770_000),
        ], []),
        status: "cancelled",
        stockPosted: false,
        history: [
          { id: "h_o7a", at: "2026-09-28", message: "Order created." },
          { id: "h_o7b", at: "2026-09-28", message: "Cancelled before fulfilment. No stock was posted." },
        ],
      },
    ],
    expenses: [
      { id: "e1", workspaceId: WS, at: "2026-10-01", category: "Stall levy", amountKobo: 2_500_000, note: "October market levy. Sample operating cost." },
      { id: "e2", workspaceId: WS, at: "2026-10-04", category: "Mobile data", amountKobo: 450_000, note: "Shop line and WhatsApp data." },
      { id: "e3", workspaceId: WS, at: "2026-10-06", category: "Packaging", amountKobo: 1_200_000, note: "Mailers and tissue. Not allocated to a product batch." },
    ],
    fees: [
      fee("fee_direct", "direct", 0, 0, 150, 0, 0),
      fee("fee_jumia", "jumia", 800, 0, 150, 50_000, 0),
      fee("fee_konga", "konga", 600, 0, 150, 40_000, 0),
    ],
    priceChanges: [
      { id: "pc1", workspaceId: WS, variantId: "v_ankara_m", at: "2026-09-01", oldPriceKobo: 1_750_000, newPriceKobo: 1_850_000, note: "Sample price increase after the new ankara batch." },
      { id: "pc2", workspaceId: WS, variantId: "v_ankara_l", at: "2026-09-01", oldPriceKobo: 1_750_000, newPriceKobo: 1_850_000, note: "Matched the indigo price." },
    ],
    scenarios: [
      { id: "sc1", workspaceId: WS, name: "Harmattan promo", variantId: "v_shea", priceKobo: 400_000, note: "Illustrative ₦4,000 shelf price.", createdAt: "2026-10-06" },
    ],
    goals: [
      { id: "g1", workspaceId: WS, title: "October sales", metric: "sales", target: 20_000_000, deadline: "2026-10-31", notes: "Sample target of ₦200,000." },
      { id: "g2", workspaceId: WS, title: "October estimated profit", metric: "profit", target: 8_000_000, deadline: "2026-10-31", notes: "Sample target of ₦80,000 after operating costs." },
    ],
    tasks: [
      { id: "t1", workspaceId: WS, title: "Collect Tunde's outstanding balance", due: "2026-10-14", done: false, notes: "ORD-1049 is partly paid." },
      { id: "t2", workspaceId: WS, title: "Receive remaining size 42 sandals", due: "2026-10-16", done: false, notes: "PO-2402 still has 5 pairs outstanding." },
      { id: "t3", workspaceId: WS, title: "Photograph brass earrings", due: "2026-10-10", done: true, notes: "Used on the product card." },
    ],
    templates: [
      { id: "tp1", workspaceId: WS, channel: "whatsapp", name: "Payment reminder", subject: "", body: "Hello {{customer}}, order {{order}} still has {{balance}} outstanding. This is a demonstration message and has not been sent." },
      { id: "tp2", workspaceId: WS, channel: "whatsapp", name: "Fulfilment update", subject: "", body: "Hello {{customer}}, {{order}} is now {{status}}. Demonstration only — nothing is sent on WhatsApp." },
      { id: "tp3", workspaceId: WS, channel: "email", name: "Invoice email", subject: "Invoice {{order}} from Adaeze Collective", body: "Hello {{customer}},\n\nYour invoice for {{order}} is ready to preview in this demo. Outstanding balance: {{balance}}.\n\nThis email is not sent." },
      { id: "tp4", workspaceId: WS, channel: "email", name: "Receipt email", subject: "Receipt for {{order}}", body: "Hello {{customer}},\n\nThis is a simulated receipt note for {{order}}. No email leaves this browser." },
    ],
    messages: [
      { id: "msg1", workspaceId: WS, channel: "whatsapp", customerId: "c2", recipient: "Tunde Bakare", subject: "", body: "Hello Tunde Bakare, order ORD-1049 still has a balance outstanding. Demonstration draft.", status: "draft", at: "2026-10-12", failureReason: "" },
      { id: "msg2", workspaceId: WS, channel: "email", customerId: "c1", recipient: "chioma@example.com", subject: "Invoice ORD-1051 from Adaeze Collective", body: "Hello Chioma Adeyemi, this simulated email failed before any provider was contacted.", status: "simulated_failed", at: "2026-10-13", failureReason: "Demo mode cannot reach an email provider." },
    ],
    projects: [
      {
        id: "dp1",
        workspaceId: WS,
        name: "Harmattan Coat",
        status: "sampling",
        concept: "Light wool-blend coat for December markets, with a removable lining.",
        materials: "Outer: sample wool blend. Lining: cotton. Buttons: horn, 4 pieces.",
        measurements: "Bust 96 cm, waist 80 cm, hip 104 cm, length 112 cm, sleeve 60 cm.",
        components: "Body, sleeve, collar, belt, care label.",
        supplierNotes: "Ask Kano Textile Mill for a 5-metre sample. Do not share customer prices on the supplier sheet.",
        estimatedCostKobo: 12_500_000,
        specs: "Stitch length 3 mm. Interfacing on collar only. Finish seams with a bias bind.",
        updatedAt: "2026-10-09",
      },
    ],
    activity: [
      { id: "a1", workspaceId: WS, at: "2026-10-13", message: "Tailoring order ORD-1051 opened for Chioma Adeyemi." },
      { id: "a2", workspaceId: WS, at: "2026-10-12", message: "Partial payment recorded on ORD-1049. Simulated, not a bank transfer." },
      { id: "a3", workspaceId: WS, at: "2026-10-11", message: "ORD-1048 delivered." },
      { id: "a4", workspaceId: WS, at: "2026-10-09", message: "Brass earrings fell to 1 unit on hand." },
    ],
    notifications: [
      { id: "n1", workspaceId: WS, title: "Low stock", body: "Brass Drop Earrings and sandal size 42 are at or below 3 units.", at: "2026-10-13", read: false, href: "/inventory" },
      { id: "n2", workspaceId: WS, title: "Outstanding balance", body: "ORD-1051 for Chioma Adeyemi is unpaid. This is sample data.", at: "2026-10-13", read: false, href: "/orders/o4" },
      { id: "n3", workspaceId: WS, title: "Email was not sent", body: "A simulated invoice email failed. No provider was contacted.", at: "2026-10-13", read: false, href: "/email" },
    ],
    shares: [],
    billing: {
      planId: "starter",
      invoices: [
        { id: "bin1", at: "2026-09-01", description: "Starter plan — September demonstration", amountKobo: 1_500_000, state: "simulated_paid" },
        { id: "bin2", at: "2026-10-01", description: "Starter plan — October demonstration", amountKobo: 1_500_000, state: "simulated_paid" },
      ],
    },
    supportNotes: [],
    users: [
      { id: "u1", name: "Adaeze Okonkwo", email: "adaeze@adaeze.example", role: "owner", status: "active" },
      { id: "u2", name: "Ibrahim Cole", email: "ibrahim@adaeze.example", role: "staff", status: "active" },
      { id: "u3", name: "Funke Adeyemi", email: "funke@adaeze.example", role: "admin", status: "invited" },
    ],
    integrationNotes: {},
  };
}

function product(
  id: string,
  name: string,
  type: DemoData["products"][number]["type"],
  status: DemoData["products"][number]["status"],
  categoryId: string,
  supplierId: string | null,
  description: string,
  trackStock: boolean,
  hue: number,
  createdAt: string,
  variants: DemoData["products"][number]["variants"],
  historyMessage: string,
): DemoData["products"][number] {
  return {
    id,
    workspaceId: WS,
    name,
    type,
    status,
    categoryId,
    supplierId,
    description,
    trackStock,
    hue,
    variants,
    createdAt,
    history: [{ id: `${id}_h`, at: createdAt, message: historyMessage }],
  };
}

function variant(id: string, name: string, sku: string, barcode: string, costKobo: number, priceKobo: number) {
  return { id, name, sku, barcode, costKobo, priceKobo };
}

function move(
  id: string,
  variantId: string,
  productId: string,
  type: DemoData["movements"][number]["type"],
  qtyDelta: number,
  at: string,
  note: string,
  ref: string,
): DemoData["movements"][number] {
  return { id, workspaceId: WS, variantId, productId, type, qtyDelta, at, note, ref };
}

function line(
  id: string,
  productId: string,
  variantId: string,
  name: string,
  variantName: string,
  sku: string,
  qty: number,
  unitPriceKobo: number,
  discountKobo: number,
  unitCostKobo: number,
): DemoData["orders"][number]["lines"][number] {
  return { id, productId, variantId, name, variantName, sku, qty, unitPriceKobo, discountKobo, unitCostKobo };
}

function order(
  id: string,
  number: string,
  customerId: string,
  createdAt: string,
  fulfilment: DemoData["orders"][number]["fulfilment"],
  discountKobo: number,
  deliveryFeeKobo: number,
  deliveryCostKobo: number,
  lines: DemoData["orders"][number]["lines"],
  payments: DemoData["orders"][number]["payments"],
): DemoData["orders"][number] {
  return {
    id,
    workspaceId: WS,
    number,
    customerId,
    createdAt,
    status: "open",
    fulfilment,
    lines,
    discountKobo,
    deliveryFeeKobo,
    deliveryCostKobo,
    payments,
    refunds: [],
    stockPosted: true,
    history: [{ id: `${id}_h`, at: createdAt, message: "Opened in the demonstration dataset." }],
  };
}

function fee(
  id: string,
  channel: DemoData["fees"][number]["channel"],
  commissionBps: number,
  marketplaceBps: number,
  paymentBps: number,
  fulfilmentKobo: number,
  otherKobo: number,
): DemoData["fees"][number] {
  return { id, workspaceId: WS, channel, commissionBps, marketplaceBps, paymentBps, fulfilmentKobo, otherKobo, updatedAt: "2026-10-01" };
}
