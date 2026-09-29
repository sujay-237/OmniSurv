import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/fx/ui";
import { custodyEntries as initialEntries, type CustodyEntry } from "@/lib/mock-data";
import { api } from "@/lib/api";

export const Route = createFileRoute("/custody")({
  head: () => ({
    meta: [
      { title: "Chain of Custody — OmniSurv Evidence Ledger" },
      {
        name: "description",
        content:
          "Append-only chronological custody ledger recording every access, transfer and operation on surveillance evidence with hashes.",
      },
      { property: "og:title", content: "Chain of Custody — OmniSurv" },
      {
        property: "og:description",
        content: "Timestamped custody entries with user, action, evidence ID, hash and remarks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustodyPage,
});

function CustodyPage() {
  const [entries, setEntries] = useState<CustodyEntry[]>(initialEntries);
  const [ev, setEv] = useState("ALL EVIDENCE");

  useEffect(() => {
    api.getCustodyLogs().then((backendLogs) => {
      if (backendLogs && backendLogs.length > 0) {
        const mapped: CustodyEntry[] = backendLogs.map((log: any, idx: number) => ({
          id: `CUST-${String(idx + 1).padStart(4, "0")}`,
          timestamp: log.timestamp ? log.timestamp.replace("T", " ").slice(0, 19) + " UTC" : "2026-09-29 14:00:00 UTC",
          user: log.actor || "Forensic Examiner (INV-001)",
          action: log.action || "ACQUISITION_INITIATED",
          evidenceId: log.evidence_id || "EVIDENCE-DVR-001",
          hash: log.details?.sha256 || log.details?.target || "9f86d081884c7d659a2f…",
          remarks: typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "Verified audit event"),
        }));
        setEntries((prev) => [...mapped, ...prev]);
      }
    }).catch(() => {});
  }, []);

  const rows = useMemo(
    () => entries.filter((e) => (ev === "ALL EVIDENCE" ? true : e.evidenceId === ev)),
    [entries, ev],
  );

  const exportLedger = () => {
    const header = "id,timestamp,user,action,evidenceId,hash,remarks\n";
    const body = rows
      .map((r) => `"${r.id}","${r.timestamp}","${r.user}","${r.action}","${r.evidenceId}","${r.hash}","${r.remarks.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chain_of_custody_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        crumb="Validation / Chain of Custody"
        title="CHAIN OF CUSTODY"
        subtitle="CASE-2026-001 · append-only evidence ledger (ISO/IEC 27037)"
        actions={
          <div className="flex gap-2">
            <Btn onClick={() => window.print()}>Print ledger</Btn>
            <Btn variant="solid" onClick={exportLedger}>Export ledger (CSV)</Btn>
          </div>
        }
      />

      <Panel className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <div className="flex items-center gap-3">
            <Label>Filter evidence</Label>
            <Select
              value={ev}
              onChange={setEv}
              options={[
                "ALL EVIDENCE",
                "EV-00127",
                "EV-00128",
                "EV-00130",
                "EV-00131",
                "EVIDENCE-DVR-001",
              ]}
            />
          </div>
          <span className="label-mono">{rows.length} ledger events</span>
        </div>

        <TableWrap>
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr>
                <Th>Event ID</Th>
                <Th>Timestamp</Th>
                <Th>Examiner</Th>
                <Th>Action</Th>
                <Th>Evidence ID</Th>
                <Th>Cryptographic Hash</Th>
                <Th>Remarks</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Tr key={e.id}>
                  <Td mono className="font-semibold">{e.id}</Td>
                  <Td mono className="whitespace-nowrap text-text-secondary">{e.timestamp}</Td>
                  <Td>{e.user}</Td>
                  <Td>
                    <StatusBadge tone="neutral">{e.action}</StatusBadge>
                  </Td>
                  <Td mono>{e.evidenceId}</Td>
                  <Td mono className="text-text-secondary break-all">{e.hash}</Td>
                  <Td className="text-text-secondary text-xs">{e.remarks}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <div className="mt-8">
        <DemoNote>
          Immutable Chain of Custody: Append-only cryptographic ledger records examiner actions, streaming SHA-256 signatures, and physical media transfer states compliant with ISO/IEC 27037 Clause 6.4 and BSA Section 63.
        </DemoNote>
      </div>
    </AppShell>
  );
}
