import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Btn,
  Label,
  Modal,
  Panel,
  PageHeader,
  Select,
  StatusBadge,
  TableWrap,
  Td,
  TextInput,
  Th,
  Tr,
  toneForStatus,
} from "@/components/fx/ui";
import { cases, type CaseStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "Cases — OmniSurv Investigation Registry" },
      {
        name: "description",
        content:
          "Investigation registry of DVR/NVR forensic cases with incident type, assigned investigator, device and evidence counts and workflow status.",
      },
      { property: "og:title", content: "Investigation Registry — OmniSurv" },
      {
        property: "og:description",
        content: "Search, filter and open forensic cases across the investigation registry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CasesPage,
});

const STATUSES = ["ALL STATUSES", "NEW", "ACQUISITION", "ANALYSIS", "REVIEW", "COMPLETED", "ARCHIVED"];
const viz = (i: number) => `var(--viz-${(i % 6) + 1})`;

function CasesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(STATUSES[0]!);
  const [sortDesc, setSortDesc] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priority, setPriority] = useState("ALL PRIORITIES");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cases
      .filter((c) =>
        term
          ? `${c.id} ${c.name} ${c.investigator} ${c.incidentType} ${c.location}`
              .toLowerCase()
              .includes(term)
          : true,
      )
      .filter((c) => (status === STATUSES[0]! ? true : c.status === (status as CaseStatus)))
      .filter((c) => (priority === "ALL PRIORITIES" ? true : c.priority === priority))
      .sort((a, b) => (sortDesc ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)));
  }, [q, status, sortDesc, priority]);

  const statusData = STATUSES.slice(1)
    .map((s) => ({ status: s, count: rows.filter((c) => c.status === s).length }))
    .filter((s) => s.count > 0);

  return (
    <AppShell>
      <PageHeader
        crumb="Investigation / Cases"
        title="CASES"
        subtitle="Investigation Registry"
        actions={
          <>
            <Link to="/cases/new">
              <Btn variant="solid">+ New case</Btn>
            </Link>
            <Btn onClick={() => setFilterOpen(true)}>Filter</Btn>
            <Btn onClick={() => setExportOpen(true)}>Export</Btn>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Panel>
          <div className="border-b border-hairline px-4 py-3"><Label>Cases by status</Label></div>
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4 px-4 py-4">
            <div className="relative h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="status" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                    {statusData.map((s, i) => <Cell key={s.status} fill={viz(i)} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold tabular-nums">{rows.length}</span>
                <span className="label-mono">cases</span>
              </div>
            </div>
            <div>
              {statusData.map((s, i) => (
                <div key={s.status} className="flex items-center gap-2 border-b border-hairline-light py-1.5 last:border-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: viz(i) }} />
                  <span className="flex-1 truncate font-mono text-[11px] uppercase tracking-[0.1em]">{s.status}</span>
                  <span className="font-mono text-xs tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <Label>Devices &amp; evidence per case</Label>
            <span className="flex gap-3 font-mono text-[10px] uppercase text-text-tertiary">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: viz(0) }} />Devices</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: viz(3) }} />Evidence</span>
            </span>
          </div>
          <div className="h-48 px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((c) => ({ id: c.id.replace("CASE-2026-", "#"), devices: c.devices, evidence: c.evidence }))}>
                <CartesianGrid vertical={false} stroke="var(--hairline-light)" />
                <XAxis dataKey="id" tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <YAxis width={28} tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "var(--surface-container)" }} contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="devices" fill={viz(0)} radius={[4, 4, 0, 0]} />
                <Bar dataKey="evidence" fill={viz(3)} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-8">
        <div className="grid grid-cols-1 gap-3 border-b border-hairline px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search case ID, investigator, incident…"
          />
          <Select value={status} onChange={setStatus} options={STATUSES} />
          <Btn onClick={() => setSortDesc((s) => !s)}>
            Sort {sortDesc ? "↓" : "↑"} Case ID
          </Btn>
        </div>

        <TableWrap>
          <table className="w-full min-w-[1040px] border-collapse">
            <thead>
              <tr>
                <Th>Case ID</Th>
                <Th>Case Name</Th>
                <Th>Incident Type</Th>
                <Th>Investigator</Th>
                <Th>Devices</Th>
                <Th>Evidence</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <Tr key={c.id}>
                  <Td mono className="font-medium">{c.id}</Td>
                  <Td className="max-w-[260px] truncate">{c.name}</Td>
                  <Td className="text-text-secondary">{c.incidentType}</Td>
                  <Td mono className="whitespace-nowrap text-text-secondary">{c.investigator}</Td>
                  <Td mono>{String(c.devices).padStart(2, "0")}</Td>
                  <Td mono>{String(c.evidence).padStart(2, "0")}</Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(c.status)}>{c.status}</StatusBadge>
                  </Td>
                  <Td mono className="whitespace-nowrap text-text-secondary">{c.created}</Td>
                  <Td>
                    <Link to="/cases/$caseId" params={{ caseId: c.id }}>
                      <Btn variant="ghost">Open</Btn>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>

        <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-2.5">
          <span className="label-mono">{rows.length} of {cases.length} records</span>
          <span className="label-mono">Forensic Case Registry · Active Ledger</span>
        </div>
      </Panel>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        crumb="Registry / Filter"
        title="Filter cases"
        footer={
          <>
            <Btn
              onClick={() => {
                setPriority("ALL PRIORITIES");
                setStatus(STATUSES[0]!);
              }}
            >
              Reset
            </Btn>
            <Btn variant="solid" onClick={() => setFilterOpen(false)}>
              Apply filter
            </Btn>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <Label className="mb-2">Status</Label>
            <Select value={status} onChange={setStatus} options={STATUSES} className="w-full" />
          </div>
          <div>
            <Label className="mb-2">Priority</Label>
            <Select
              value={priority}
              onChange={setPriority}
              options={["ALL PRIORITIES", "CRITICAL", "HIGH", "MEDIUM", "LOW"]}
              className="w-full"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        crumb="Registry / Export"
        title="Export case registry"
        footer={
          <>
            <Btn onClick={() => setExportOpen(false)}>Close</Btn>
            <Btn
              variant="solid"
              onClick={() => {
                const header = "id,name,incidentType,investigator,evidenceCount,status,priority,created\n";
                const content = rows
                  .map((r) => `"${r.id}","${r.name}","${r.incidentType}","${r.investigator}",${r.evidenceCount},"${r.status}","${r.priority}","${r.created}"`)
                  .join("\n");
                const blob = new Blob([header + content], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `cases_registry_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                setExportOpen(false);
              }}
            >
              Download CSV
            </Btn>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Export {rows.length} case records formatted for forensic chain-of-custody archive.
        </p>
        <div className="mt-5 flex gap-2">
          {["CSV", "JSON"].map((f) => (
            <Btn
              key={f}
              onClick={() => {
                let body = "";
                let mime = "text/csv";
                if (f === "JSON") {
                  body = JSON.stringify(rows, null, 2);
                  mime = "application/json";
                } else {
                  const header = "id,name,incidentType,investigator,evidenceCount,status,priority,created\n";
                  body = header + rows.map((r) => `"${r.id}","${r.name}","${r.incidentType}","${r.investigator}",${r.evidenceCount},"${r.status}","${r.priority}","${r.created}"`).join("\n");
                }
                const blob = new Blob([body], { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `cases_registry.${f.toLowerCase()}`;
                a.click();
                URL.revokeObjectURL(url);
                setExportOpen(false);
              }}
            >
              Export {f}
            </Btn>
          ))}
        </div>
      </Modal>
    </AppShell>
  );
}
