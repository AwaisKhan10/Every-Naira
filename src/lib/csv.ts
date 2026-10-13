export interface CsvTable {
  headers: string[];
  rows: string[][];
}

export function parseCsv(text: string): CsvTable | { error: string } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }
  if (inQuotes) return { error: "The CSV has an unmatched quote. Close the quoted cell and try again." };
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (rows.length === 0) return { error: "The file is empty." };
  const [headers, ...body] = rows;
  if (!headers || headers.every((header) => header === "")) return { error: "The file needs a header row." };
  return { headers, rows: body };
}

export function toCsv(headers: string[], rows: string[][]): string {
  const encode = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  return [headers, ...rows].map((row) => row.map(encode).join(",")).join("\n");
}

export const PRODUCT_FIELDS = ["name", "type", "sku", "category", "price", "cost", "stock", "barcode", "description"] as const;
export type ProductField = (typeof PRODUCT_FIELDS)[number];

export function autoMapHeaders(headers: string[]): Record<ProductField, string> {
  const mapping = Object.fromEntries(PRODUCT_FIELDS.map((field) => [field, ""])) as Record<ProductField, string>;
  for (const header of headers) {
    const key = header.trim().toLowerCase();
    const match = PRODUCT_FIELDS.find((field) => field === key);
    if (match && !mapping[match]) mapping[match] = header;
  }
  return mapping;
}

export interface ProductCsvDraft {
  row: number;
  name: string;
  type: "physical" | "digital" | "service";
  sku: string;
  category: string;
  priceKobo: number;
  costKobo: number;
  stock: number | null;
  barcode: string;
  description: string;
}

export interface ProductCsvIssue {
  row: number;
  message: string;
}

function parseAmount(value: string): number | null {
  const cleaned = value.trim().replace(/₦/g, "").replace(/,/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(`${frac}00`.slice(0, 2));
}

export function validateProductCsv(
  table: CsvTable,
  mapping: Record<ProductField, string>,
  existingSkus: string[],
): { drafts: ProductCsvDraft[]; issues: ProductCsvIssue[] } {
  const drafts: ProductCsvDraft[] = [];
  const issues: ProductCsvIssue[] = [];
  const headerIndex = new Map(table.headers.map((header, index) => [header, index]));
  const required: ProductField[] = ["name", "type", "sku", "price"];
  for (const field of required) {
    if (!mapping[field] || !headerIndex.has(mapping[field])) {
      issues.push({ row: 1, message: `Map the ${field} column before importing.` });
    }
  }
  if (issues.length > 0) return { drafts, issues };

  const seen = new Set(existingSkus.map((sku) => sku.toLowerCase()));
  table.rows.forEach((cells, index) => {
    const row = index + 2;
    const read = (field: ProductField) => {
      const header = mapping[field];
      if (!header) return "";
      const position = headerIndex.get(header);
      return position === undefined ? "" : (cells[position] ?? "");
    };
    const name = read("name").trim();
    const type = read("type").trim().toLowerCase();
    const sku = read("sku").trim();
    const price = parseAmount(read("price"));
    const costRaw = read("cost").trim();
    const cost = costRaw === "" ? 0 : parseAmount(costRaw);
    const stockRaw = read("stock").trim();
    const rowIssues: string[] = [];
    if (name.length < 2) rowIssues.push("Name must be at least 2 characters.");
    if (type !== "physical" && type !== "digital" && type !== "service") rowIssues.push("Type must be physical, digital, or service.");
    if (sku.length < 2) rowIssues.push("SKU is required.");
    if (price === null || price < 0) rowIssues.push("Price must be a number with up to 2 decimal places.");
    if (cost === null || cost < 0) rowIssues.push("Cost must be blank or a valid amount.");
    let stock: number | null = null;
    if (stockRaw !== "") {
      if (!/^\d+$/.test(stockRaw)) rowIssues.push("Stock must be a whole number or blank.");
      else stock = Number(stockRaw);
    }
    if (type !== "physical" && stock !== null && stock > 0) rowIssues.push("Only physical products can import a stock quantity.");
    if (sku && seen.has(sku.toLowerCase())) rowIssues.push(`SKU ${sku} is duplicated in this file or already exists.`);
    if (rowIssues.length > 0) {
      rowIssues.forEach((message) => issues.push({ row, message }));
      return;
    }
    seen.add(sku.toLowerCase());
    drafts.push({
      row,
      name,
      type: type as ProductCsvDraft["type"],
      sku,
      category: read("category").trim() || "Uncategorised",
      priceKobo: price ?? 0,
      costKobo: cost ?? 0,
      stock: type === "physical" ? stock ?? 0 : null,
      barcode: read("barcode").trim(),
      description: read("description").trim(),
    });
  });
  if (table.rows.length === 0) issues.push({ row: 1, message: "There are no data rows to import." });
  return { drafts, issues };
}
