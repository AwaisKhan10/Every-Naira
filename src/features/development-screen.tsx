"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { saveProject } from "@/lib/domain";
import { todayIso, uid } from "@/lib/format";
import { formatNgn, parseNairaToKobo } from "@/lib/money";
import { byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";

export function DevelopmentScreen() {
  const data = useDemoStore((state) => state.data);
  const projects = byWorkspace(data.projects, data.activeWorkspaceId);
  return (
    <div>
      <PageHeader title="Product development" description="Mini tech packs are a frontend preview. Secure supplier sharing needs a backend, which this demo does not have." actions={<Link href="/development/new" className="inline-flex h-10 items-center rounded-md bg-accent px-3 text-sm text-accent-ink">New project</Link>} />
      <div className="grid gap-3">
        {projects.length === 0 ? <p className="text-sm text-muted">No development records in this workspace.</p> : projects.map((project) => (
          <Card key={project.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/development/${project.id}`} className="font-medium">{project.name}</Link>
              <Badge>{project.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{project.concept}</p>
            <p className="mt-2 text-sm tabular-nums">Estimated cost {formatNgn(project.estimatedCostKobo)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DevelopmentEditor({ projectId }: { projectId: string | null }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const existing = data.projects.find((project) => project.id === projectId);
  const [name, setName] = useState(existing?.name ?? "");
  const [status, setStatus] = useState(existing?.status ?? "concept");
  const [concept, setConcept] = useState(existing?.concept ?? "");
  const [materials, setMaterials] = useState(existing?.materials ?? "");
  const [measurements, setMeasurements] = useState(existing?.measurements ?? "");
  const [components, setComponents] = useState(existing?.components ?? "");
  const [supplierNotes, setSupplierNotes] = useState(existing?.supplierNotes ?? "");
  const [specs, setSpecs] = useState(existing?.specs ?? "");
  const [cost, setCost] = useState(existing ? String(existing.estimatedCostKobo / 100) : "0");
  const id = existing?.id ?? "new-local";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault();
        const parsed = parseNairaToKobo(cost);
        if (parsed === null) return;
        const savedId = existing?.id ?? uid("dev");
        apply(saveProject(data, { id: savedId, workspaceId: data.activeWorkspaceId, name, status, concept, materials, measurements, components, supplierNotes, estimatedCostKobo: parsed, specs, date: todayIso() }));
      }}>
        <PageHeader title={existing ? existing.name : "New development record"} description="The preview on the right uses these fields." />
        <Field label="Name"><TextInput value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Status"><SelectInput value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="concept">Concept</option><option value="sampling">Sampling</option><option value="costing">Costing</option><option value="ready">Ready</option></SelectInput></Field>
        <Field label="Concept"><TextArea value={concept} onChange={(event) => setConcept(event.target.value)} /></Field>
        <Field label="Materials"><TextArea value={materials} onChange={(event) => setMaterials(event.target.value)} /></Field>
        <Field label="Measurements"><TextArea value={measurements} onChange={(event) => setMeasurements(event.target.value)} /></Field>
        <Field label="Components"><TextArea value={components} onChange={(event) => setComponents(event.target.value)} /></Field>
        <Field label="Supplier notes"><TextArea value={supplierNotes} onChange={(event) => setSupplierNotes(event.target.value)} /></Field>
        <Field label="Specifications"><TextArea value={specs} onChange={(event) => setSpecs(event.target.value)} /></Field>
        <Field label="Estimated cost (₦)"><TextInput value={cost} onChange={(event) => setCost(event.target.value)} /></Field>
        <div className="flex gap-2"><Button type="submit">Save</Button><Link href={`/documents/techpack/${existing?.id ?? id}`} className="inline-flex h-10 items-center text-sm text-accent">Open tech pack</Link></div>
      </form>
      <Card className="p-4 text-sm">
        <p className="text-xs text-muted">Supplier-safe preview. Customer selling prices are not shown. Printing this page is a simulation.</p>
        <h2 className="mt-2 text-lg font-medium">{name || "Untitled"}</h2>
        <p className="mt-2">{concept}</p>
        <p className="mt-2"><strong>Materials. </strong>{materials}</p>
        <p className="mt-2"><strong>Measurements. </strong>{measurements}</p>
        <p className="mt-2"><strong>Estimated cost. </strong>{formatNgn(parseNairaToKobo(cost) ?? 0)}</p>
        <Button type="button" className="mt-4" variant="secondary" onClick={() => window.print()}>Print preview</Button>
      </Card>
    </div>
  );
}
