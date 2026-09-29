import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { custodyEntries } from "@/lib/mock-data";

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
  const [ev, setEv] = useState("ALL EVIDENCE");
  const rows = useMemo(
    () => custodyEntries.filter((e) => (ev === "ALL EVIDENCE" ? true : e.evidenceId === ev)),
    [ev],
  );

  return (
    <AppShell>
      <PageHeader
        crumb="Validation / Chain of Custody"
        title="CHAIN OF CUSTODY"
        subtitle="CASE-2026-014 · append-only evidence ledger"
        actions={
          <>
            <Btn>Print ledger</Btn>
            <Btn variant="solid">Export ledger</Btn>
          </>
        }
      />

      <Panel className="mt-8">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3">
          <Label>Evidence filter</Label>
          <Select value={ev} onChange={setEv} options={["ALL EVIDENCE", "EV-00127", "EV-00128"]} />
          <StatusBadge tone="verified" className="ml-auto">Ledger sealed · append-only</StatusBadge>
        </div>

        <div className="px-4 py-6">
          <div className="border-b border-hairline pb-3">
            <Label>26 SEP 2026</Label>
          </div>
          <div className="relative pl-6">
            <div className="absolute top-0 bottom-0 left-[7px] w-px bg-hairline" />
            {rows.map((e) => (
              <div key={e.time} className="relative py-5">
                <span className="absolute top-6 -left-[23px] h-3 w-3 border border-foreground bg-card" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[86px_minmax(0,1fr)]">
                  <div className="font-mono text-sm">{e.time}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[15px] font-semibold tracking-tight">{e.action}</span>
                      <StatusBadge tone="navy">{e.user}</StatusBadge>
                      <StatusBadge tone="neutral">{e.evidenceId}</StatusBadge>
                    </div>
                    <div className="mt-2 font-mono text-[11px] break-all text-text-tertiary">
                      HASH · {e.hash}
                    </div>
                    <p className="mt-1.5 text-sm text-text-secondary">{e.remarks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="mt-8">
        <SectionTitle right={<span className="label-mono">{rows.length} entries</span>}>
          Ledger table
        </SectionTitle>
        <TableWrap>
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <Th>Timestamp</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Evidence ID</Th>
                <Th>Hash</Th>
                <Th>Remarks</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Tr key={e.time}>
                  <Td mono className="whitespace-nowrap">{e.date} {e.time}</Td>
                  <Td mono>{e.user}</Td>
                  <Td>{e.action}</Td>
                  <Td mono>{e.evidenceId}</Td>
                  <Td mono className="text-text-secondary">{e.hash}</Td>
                  <Td className="text-text-secondary">{e.remarks}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <div className="mt-8">
        <DemoNote />
      </div>
    </AppShell>
  );
}
