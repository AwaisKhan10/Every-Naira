"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell";
import { Button, Card, Field, SelectInput, TableFrame, Td, Th } from "@/components/ui";
import { autoMapHeaders, parseCsv, PRODUCT_FIELDS, toCsv, validateProductCsv, type ProductField } from "@/lib/csv";
import { importProducts } from "@/lib/domain";
import { todayIso, uid } from "@/lib/format";
import { formatNgn } from "@/lib/money";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";

const SAMPLE = "name,type,sku,category,price,cost,stock\nBrass cuff,physical,BRC-1,Accessories,4200,1500,6\nCare guide,digital,CARE-1,Digital,2500,0,\n";

export function ImportScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<ProductField, string> | null>(null);
  const [done, setDone] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseCsv(text) : null), [text]);
  const table = parsed && !("error" in parsed) ? parsed : null;
  const activeMapping = mapping ?? (table ? autoMapHeaders(table.headers) : null);
  const existing = byWorkspace(data.products, data.activeWorkspaceId).flatMap((product) => product.variants.map((variant) => variant.sku));
  const validated = table && activeMapping ? validateProductCsv(table, activeMapping, existing) : null;

  function downloadTemplate() {
    const blob = new Blob([SAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function confirm(validOnly: boolean) {
    if (!validated) return;
    if (!validOnly && validated.issues.length > 0) return;
    const result = importProducts(data, {
      workspaceId: data.activeWorkspaceId,
      date: todayIso(),
      drafts: validated.drafts,
      ids: validated.drafts.map(() => ({ productId: uid("prd"), variantId: uid("var"), movementId: uid("mov"), historyId: uid("hist") })),
    });
    if (apply(result) && result.ok) {
      setDone(result.message);
      setText("");
      setMapping(null);
    }
  }

  return (
    <div>
      <PageHeader title="CSV import" description="This import changes demonstration state in the browser only. It is not saved to a production database." actions={<Button variant="secondary" onClick={downloadTemplate}>Download template</Button>} />
      <Card className="grid gap-3 p-4">
        <Field label="CSV file" hint="Products are the first supported entity.">
          <input className="block text-sm" type="file" accept=".csv,text/csv" aria-label="Upload CSV" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setFileName(file.name);
            setText(await file.text());
            setMapping(null);
            setDone("");
          }} />
        </Field>
        {fileName ? <p className="text-xs text-muted">{fileName}</p> : null}
        {parsed && "error" in parsed ? <p className="text-sm text-danger">{parsed.error}</p> : null}
        {table && activeMapping ? (
          <div className="grid gap-2 md:grid-cols-3">
            {PRODUCT_FIELDS.map((field) => (
              <Field key={field} label={field}>
                <SelectInput value={activeMapping[field]} onChange={(event) => setMapping({ ...activeMapping, [field]: event.target.value })}>
                  <option value="">Not mapped</option>
                  {table.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </SelectInput>
              </Field>
            ))}
          </div>
        ) : null}
      </Card>
      {table ? (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium">Preview</h2>
          <TableFrame>
            <thead><tr>{table.headers.map((header) => <Th key={header}>{header}</Th>)}</tr></thead>
            <tbody>{table.rows.slice(0, 8).map((row, index) => <tr key={index}>{table.headers.map((_, cell) => <Td key={cell}>{row[cell]}</Td>)}</tr>)}</tbody>
          </TableFrame>
        </div>
      ) : null}
      {validated ? (
        <div className="mt-4 grid gap-3">
          <p className="text-sm">{validated.drafts.length} valid row{validated.drafts.length === 1 ? "" : "s"} · {validated.issues.length} issue{validated.issues.length === 1 ? "" : "s"}</p>
          {validated.issues.map((issue, index) => <p key={index} className="text-sm text-danger">Row {issue.row}: {issue.message}</p>)}
          {validated.drafts.map((draft) => <p key={draft.sku} className="text-sm">{draft.name} · {draft.sku} · {formatNgn(draft.priceKobo)}</p>)}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={validated.issues.length > 0 || validated.drafts.length === 0} onClick={() => confirm(false)}>Confirm import</Button>
            <Button type="button" variant="secondary" disabled={validated.drafts.length === 0} onClick={() => confirm(true)}>Import valid rows only</Button>
          </div>
        </div>
      ) : null}
      {done ? <p className="mt-4 text-sm">{done} You can review them on the products page.</p> : null}
      <p className="mt-4 text-xs text-muted">Export check: {toCsv(["sku"], [["sample"]]).startsWith("sku") ? "CSV writer is available." : ""}</p>
    </div>
  );
}
