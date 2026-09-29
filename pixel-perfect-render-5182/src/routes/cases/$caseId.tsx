import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Bar,
  Btn,
  DefRow,
  Dot,
  EmptyState,
  Label,
  MetricCard,
  Panel,
  PageHeader,
  SectionTitle,
  StatusBadge,
  TableWrap,
  Tabs,
  Td,
  Th,
  Tr,
  toneForStatus,
} from "@/components/fx/ui";
import {
  cases,
  custodyEntries,
  devices,
  evidence,
  timelineEvents,
} from "@/lib/mock-data";

export const Route = createFileRoute("/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case Details — OmniSurv Investigation Record" },
      {
        name: "description",
        content:
          "Case record with linked DVR/NVR devices, acquired evidence, timeline events, integrity status and chain of custody.",
      },
      { property: "og:title", content: "Case Details — OmniSurv" },
      {
        property: "og:description",
        content: "Devices, evidence, timeline, analysis and custody ledger for one investigation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaseDetail,
});

const TABS = ["OVERVIEW", "DEVICES", "EVIDENCE", "TIMELINE", "ANALYSIS", "CHAIN OF CUSTODY", "REPORTS"];

function CaseDetail() {
  const { caseId } = useParams({ from: "/cases/$caseId" });
  const c = cases.find((x) => x.id === caseId) ?? cases[0]!;
  const [tab, setTab] = useState(TABS[0]!);

  const caseDevices = devices.filter((d) => d.caseId === c.id);
  const caseEvidence = evidence.filter((e) => e.caseId === c.id);

  return (
    <AppShell>
      <PageHeader
        crumb={`Case / ${c.id}`}
        title={c.id}
        subtitle={c.name}
        actions={
          <>
            <StatusBadge tone={toneForStatus(c.status)} className="self-center px-3 py-1.5">
              {c.status}
            </StatusBadge>
            <Link to="/reports">
              <Btn variant="solid">Generate report</Btn>
            </Link>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-3 xl:grid-cols-6">
        <div className="bg-card px-4 py-4">
          <Label>Investigator</Label>
          <div className="mt-2 font-mono text-xs">{c.investigator}</div>
        </div>
        <div className="bg-card px-4 py-4">
          <Label>Incident date</Label>
          <div className="mt-2 font-mono text-xs">{c.incidentDate}</div>
        </div>
        <div className="bg-card px-4 py-4">
          <Label>Location</Label>
          <div className="mt-2 font-mono text-xs">{c.location}</div>
        </div>
        <div className="bg-card px-4 py-4">
          <Label>Priority</Label>
          <div className="mt-2">
            <StatusBadge tone={toneForStatus(c.priority)}>{c.priority}</StatusBadge>
          </div>
        </div>
        <div className="bg-card px-4 py-4">
          <Label>Created</Label>
          <div className="mt-2 font-mono text-xs">{c.created}</div>
        </div>
        <div className="bg-card px-4 py-4">
          <Label>Last updated</Label>
          <div className="mt-2 font-mono text-xs">{c.updated}</div>
        </div>
      </div>

      <Panel className="mt-8">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "OVERVIEW" ? (
          <div className="px-4 py-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline lg:grid-cols-5">
              <MetricCard label="DEVICES" value={String(c.devices).padStart(2, "0")} note="OEM IDENTIFIED" />
              <MetricCard label="EVIDENCE ITEMS" value={String(c.evidence).padStart(2, "0")} note="INTAKE COMPLETE" />
              <MetricCard label="RECOVERED FILES" value={String(c.recovered)} note="CARVED / REBUILT" />
              <MetricCard label="INTEGRITY" value="OK" note="SHA-256 MATCHED" />
              <MetricCard label="ANALYSIS" value={c.status} note="CURRENT STAGE" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="border border-hairline">
                <SectionTitle>Workflow progress</SectionTitle>
                <div className="space-y-4 px-4 py-4">
                  {[
                    ["IDENTIFICATION", 100],
                    ["ACQUISITION", 100],
                    ["HASH VERIFICATION", 100],
                    ["RECOVERY", 92],
                    ["VIDEO ANALYSIS", 48],
                    ["REPORTING", 10],
                  ].map(([s, p]) => (
                    <div key={s as string}>
                      <div className="flex justify-between">
                        <Label className="text-foreground">{s as string}</Label>
                        <span className="font-mono text-xs">{p as number}%</span>
                      </div>
                      <Bar className="mt-2" pct={p as number} tone={(p as number) === 100 ? "verified" : "ink"} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-hairline">
                <SectionTitle>Case notes</SectionTitle>
                <div className="px-4 py-4 text-sm leading-6 text-text-secondary">
                  Surveillance recorder seized from the premises under a read-only bridge.
                  Channel CAM-03 shows a deleted segment aligned to the reported incident
                  window; carving recovered 198 of 214 candidate records. System clock offset
                  of +04:17 confirmed against the recorder configuration and applied to all
                  timeline correlation.
                </div>
                <div className="border-t border-hairline px-4 py-3">
                  <StatusBadge tone="verified">
                    <Dot /> Integrity verified
                  </StatusBadge>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "DEVICES" ? (
          <TableWrap>
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr>
                  <Th>Device ID</Th>
                  <Th>Manufacturer</Th>
                  <Th>Model</Th>
                  <Th>Channels</Th>
                  <Th>Storage</Th>
                  <Th>File System</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {caseDevices.map((d) => (
                  <Tr key={d.id}>
                    <Td mono>{d.id}</Td>
                    <Td>{d.manufacturer}</Td>
                    <Td mono className="text-text-secondary">{d.model}</Td>
                    <Td mono>{d.channels}</Td>
                    <Td mono>{d.storage}</Td>
                    <Td mono className="text-text-secondary">{d.fileSystem}</Td>
                    <Td>
                      <StatusBadge tone={toneForStatus(d.status)}>{d.status}</StatusBadge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : null}

        {tab === "EVIDENCE" ? (
          caseEvidence.length ? (
            <TableWrap>
              <table className="w-full min-w-[880px] border-collapse">
                <thead>
                  <tr>
                    <Th>Evidence ID</Th>
                    <Th>File Name</Th>
                    <Th>Source</Th>
                    <Th>Type</Th>
                    <Th>Size</Th>
                    <Th>Hash Status</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {caseEvidence.map((e) => (
                    <Tr key={e.id}>
                      <Td mono>{e.id}</Td>
                      <Td mono>{e.fileName}</Td>
                      <Td mono className="text-text-secondary">{e.source}</Td>
                      <Td className="text-text-secondary">{e.type}</Td>
                      <Td mono>{e.size}</Td>
                      <Td>
                        <StatusBadge tone={toneForStatus(e.hashStatus)}>{e.hashStatus}</StatusBadge>
                      </Td>
                      <Td>
                        <StatusBadge tone={toneForStatus(e.status)}>{e.status}</StatusBadge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <div className="px-4 py-5">
              <EmptyState title="No evidence registered" note="Acquire a source device to populate this ledger." />
            </div>
          )
        ) : null}

        {tab === "TIMELINE" ? (
          <div className="px-4 py-5">
            {timelineEvents.map((e) => (
              <div
                key={e.time}
                className="grid grid-cols-[86px_92px_minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline-light py-3 last:border-0"
              >
                <span className="font-mono text-xs">{e.time}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{e.camera}</span>
                <span className="truncate text-[13px]">{e.label}</span>
                <Link to="/timeline">
                  <Btn variant="ghost">Open timeline</Btn>
                </Link>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "ANALYSIS" ? (
          <div className="grid grid-cols-1 gap-px bg-hairline px-0 py-0 md:grid-cols-2">
            <div className="bg-card px-4 py-5">
              <Label>Detection summary</Label>
              <div className="mt-4 space-y-3">
                {[["PERSON", 42], ["VEHICLE", 17], ["FACE", 8], ["MOTION EVENTS", 64]].map(([l, v]) => (
                  <div key={l as string} className="flex items-center justify-between border-b border-hairline-light pb-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{l as string}</span>
                    <span className="font-mono text-sm tabular-nums">{v as number}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card px-4 py-5">
              <Label>Analyst position</Label>
              <p className="mt-4 text-sm leading-6 text-text-secondary">
                Assistive detections are indicative only and require analyst confirmation
                before inclusion in the forensic report. All counts shown here are demo values
                produced by the prototype, not by a model.
              </p>
              <div className="mt-4 flex gap-2">
                <Link to="/ai">
                  <Btn>Open AI analytics</Btn>
                </Link>
                <Link to="/findings">
                  <Btn>Findings</Btn>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "CHAIN OF CUSTODY" ? (
          <div className="px-4 py-5">
            {custodyEntries.map((e) => (
              <div
                key={e.time}
                className="grid grid-cols-[76px_86px_minmax(0,1fr)] items-start gap-4 border-b border-hairline-light py-3 last:border-0"
              >
                <span className="font-mono text-xs">{e.time}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{e.user}</span>
                <span className="min-w-0">
                  <span className="block text-[13px]">{e.action}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-text-tertiary">
                    {e.evidenceId} · {e.hash}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "REPORTS" ? (
          <div className="px-4 py-5">
            <TableWrap>
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <Th>Report ID</Th>
                    <Th>Version</Th>
                    <Th>Generated</Th>
                    <Th>Author</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  <Tr>
                    <Td mono>RPT-0031</Td>
                    <Td mono>DRAFT 3</Td>
                    <Td mono className="text-text-secondary">26 SEP 2026 16:02 UTC</Td>
                    <Td mono>INV-001</Td>
                    <Td><StatusBadge tone="event">REVIEW</StatusBadge></Td>
                  </Tr>
                  <Tr>
                    <Td mono>RPT-0028</Td>
                    <Td mono>DRAFT 2</Td>
                    <Td mono className="text-text-secondary">25 SEP 2026 11:44 UTC</Td>
                    <Td mono>INV-001</Td>
                    <Td><StatusBadge tone="neutral">SUPERSEDED</StatusBadge></Td>
                  </Tr>
                </tbody>
              </table>
            </TableWrap>
          </div>
        ) : null}
      </Panel>

      <Panel className="mt-8">
        <SectionTitle>Record metadata</SectionTitle>
        <DefRow label="Case ID" value={c.id} />
        <DefRow label="Incident type" value={c.incidentType} />
        <DefRow label="Assigned" value={c.investigator} />
        <DefRow label="Integrity" value="SHA-256 MATCHED" tone="verified" />
      </Panel>
    </AppShell>
  );
}
