import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
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
import { auditLog } from "@/lib/mock-data";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — OmniSurv System Activity Record" },
      {
        name: "description",
        content:
          "Immutable record of user actions across case management, acquisition, integrity, recovery and reporting modules.",
      },
      { property: "og:title", content: "Audit Log — OmniSurv" },
      {
        property: "og:description",
        content: "Timestamped operator actions with module, evidence reference and outcome.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditPage,
});

const MODULES = [
  "ALL MODULES",
  "CASE MANAGEMENT",
  "DEVICES",
  "ACQUISITION",
  "INTEGRITY",
  "RECOVERY",
  "EVIDENCE",
  "USERS & ROLES",
  "REPORTS",
];

function AuditPage() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState(MODULES[0]!);
  const [status, setStatus] = useState("ALL OUTCOMES");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return auditLog
      .filter((r) => (term ? `${r.user} ${r.action} ${r.evidence}`.toLowerCase().includes(term) : true))
      .filter((r) => (mod === MODULES[0]! ? true : r.module === mod))
      .filter((r) => (status === "ALL OUTCOMES" ? true : r.status === status));
  }, [q, mod, status]);

  return (
    <AppShell>
      <PageHeader
        crumb="System / Audit Log"
        title="AUDIT LOG"
        subtitle="26 SEP 2026 · operator activity record"
        actions={<Btn>Export log</Btn>}
      />

      <Panel className="mt-8">
        <div className="grid grid-cols-1 gap-3 border-b border-hairline px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, action, evidence…" />
          <Select value={mod} onChange={setMod} options={MODULES} />
          <Select value={status} onChange={setStatus} options={["ALL OUTCOMES", "SUCCESS", "MISMATCH"]} />
        </div>
        <TableWrap>
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <Th>Timestamp</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Module</Th>
                <Th>Evidence</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.time}>
                  <Td mono>{r.time}</Td>
                  <Td mono>{r.user}</Td>
                  <Td>{r.action}</Td>
                  <Td mono className="text-text-secondary">{r.module}</Td>
                  <Td mono>{r.evidence}</Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(r.status)}>{r.status}</StatusBadge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-2.5">
          <span className="label-mono">{rows.length} of {auditLog.length} entries</span>
          <span className="label-mono">Append-only Forensic Audit Trail · Active Ledger</span>
        </div>
      </Panel>

      <div className="mt-8">
        <DemoNote>
          Immutable Forensic Audit Ledger: Every user interaction, stream carving operation, and cryptographic verification is permanently stamped with UTC timecodes for legal non-repudiation under ISO/IEC 27037.
        </DemoNote>
      </div>
    </AppShell>
  );
}
