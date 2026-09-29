import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const DETECTIONS = [
  { l: "PERSON", v: 42 },
  { l: "VEHICLE", v: 17 },
  { l: "FACE", v: 8 },
  { l: "BAG / OBJECT", v: 11 },
];
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
  Label,
  Modal,
  Panel,
  PageHeader,
  SectionTitle,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/fx/ui";
import { aiCounts, bookmarks, detectedEvents } from "@/lib/mock-data";

export const Route = createFileRoute("/findings")({
  head: () => ({
    meta: [
      { title: "Investigation Findings — OmniSurv Analyst Record" },
      {
        name: "description",
        content:
          "Consolidated investigation findings: detected events, important frames, bookmarks, object detections, motion events and analyst notes.",
      },
      { property: "og:title", content: "Investigation Findings — OmniSurv" },
      {
        property: "og:description",
        content: "Bookmarks, detections and analyst notes assembled for the forensic report.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindingsPage,
});

function FindingsPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(bookmarks.map((b) => [b.id, b.note])),
  );
  const [draft, setDraft] = useState("");
  const [analystNote, setAnalystNote] = useState(
    "Recorder clock offset of +04:17 verified against device configuration; all findings below are stated in UTC. CAM-03 deleted segment recovered and hash-matched before review.",
  );

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / Findings"
        title="INVESTIGATION FINDINGS"
        subtitle="CASE-2026-014 · analyst record"
        actions={
          <>
            <Btn>Export findings</Btn>
            <Link to="/reports">
              <Btn variant="solid">Compose report</Btn>
            </Link>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-4">
        {aiCounts.map((c) => (
          <div key={c.label} className="bg-card px-4 py-4">
            <Label>{c.label}</Label>
            <div className="mt-3 text-3xl font-extrabold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <Panel>
            <SectionTitle right={<span className="label-mono">{detectedEvents.length} events</span>}>
              Detected events
            </SectionTitle>
            <TableWrap>
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <Th>Timestamp</Th>
                    <Th>Camera</Th>
                    <Th>Type</Th>
                    <Th>Confidence</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {detectedEvents.map((e) => (
                    <Tr key={e.time + e.type}>
                      <Td mono>{e.time}</Td>
                      <Td mono>{e.camera}</Td>
                      <Td mono>{e.type}</Td>
                      <Td mono>{e.confidence}</Td>
                      <Td>
                        <Link to="/video">
                          <Btn variant="ghost">View video</Btn>
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Panel>

          <Panel>
            <SectionTitle>Important frames</SectionTitle>
            <div className="grid grid-cols-2 gap-px bg-hairline md:grid-cols-3">
              {["14:32:18", "14:32:22", "14:32:31", "14:41:07", "15:04:55", "15:12:40"].map((t, i) => (
                <div key={t} className="bg-card p-3">
                  <div className="relative aspect-video bg-navy-deep">
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 3px)",
                      }}
                    />
                    {i < 3 ? (
                      <div className="absolute top-[34%] left-[40%] h-[34%] w-[14%] border-2 border-event" />
                    ) : null}
                  </div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
                    {t} · CAM-0{(i % 4) + 1}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle>Motion events</SectionTitle>
            <div className="px-4 py-4">
              {[
                ["12:06 – 12:48", "CAM-01", "Intermittent motion, 6 triggers"],
                ["14:24 – 14:38", "CAM-03", "Sustained motion at entry door"],
                ["14:31 – 14:34", "CAM-02", "Vehicle approach and stop"],
                ["15:02 – 15:09", "CAM-04", "Motion at perimeter fence"],
              ].map(([w, cam, note]) => (
                <div key={w} className="grid grid-cols-[130px_80px_minmax(0,1fr)] gap-4 border-b border-hairline-light py-3 last:border-0">
                  <span className="font-mono text-xs">{w}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{cam}</span>
                  <span className="text-[13px]">{note}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel>
            <SectionTitle right={<span className="label-mono">{bookmarks.length} saved</span>}>
              Bookmarks
            </SectionTitle>
            <div className="px-4 py-2">
              {bookmarks.map((b) => (
                <div key={b.id} className="border-b border-hairline-light py-4 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="label-mono text-foreground">{b.id}</span>
                    <StatusBadge tone="navy">{b.camera}</StatusBadge>
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-text-tertiary">{b.time}</div>
                  <p className="mt-2 text-sm text-foreground">“{notes[b.id]!}”</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/video">
                      <Btn variant="ghost">View video</Btn>
                    </Link>
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        setEditing(b.id);
                        setDraft(notes[b.id]!);
                      }}
                    >
                      Edit note
                    </Btn>
                    <Btn variant="ghost">Export</Btn>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle>Object detections</SectionTitle>
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-5 px-4 py-4">
              <div className="relative h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DETECTIONS} dataKey="v" nameKey="l" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                      {DETECTIONS.map((d, i) => (
                        <Cell key={d.l} fill={`var(--viz-${i + 1})`} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold tabular-nums">{DETECTIONS.reduce((a, d) => a + d.v, 0)}</span>
                  <span className="label-mono">total</span>
                </div>
              </div>
              <div>
                {DETECTIONS.map((d, i) => (
                  <div key={d.l} className="grid grid-cols-[10px_minmax(0,1fr)_minmax(0,1fr)_28px] items-center gap-3 border-b border-hairline-light py-2 last:border-0">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--viz-${i + 1})` }} />
                    <span className="truncate font-mono text-[11px] uppercase tracking-[0.14em]">{d.l}</span>
                    <span className="h-2 w-full rounded-full bg-surface-container">
                      <span className="block h-full rounded-full" style={{ width: `${(d.v / 42) * 100}%`, background: `var(--viz-${i + 1})` }} />
                    </span>
                    <span className="text-right font-mono text-sm tabular-nums">{d.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionTitle>Analyst notes</SectionTitle>
            <div className="px-4 py-4">
              <textarea
                rows={7}
                value={analystNote}
                onChange={(e) => setAnalystNote(e.target.value)}
                className="w-full border border-hairline bg-card px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-navy"
              />
              <div className="mt-3 flex justify-end">
                <Btn variant="solid">Save note</Btn>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <DemoNote />
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        crumb={`Findings / ${editing ?? ""}`}
        title="Edit bookmark note"
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn
              variant="solid"
              onClick={() => {
                if (editing) setNotes((n) => ({ ...n, [editing]: draft }));
                setEditing(null);
              }}
            >
              Save
            </Btn>
          </>
        }
      >
        <textarea
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full border border-hairline bg-card px-3 py-2 font-mono text-xs outline-none focus:border-navy"
        />
      </Modal>
    </AppShell>
  );
}
