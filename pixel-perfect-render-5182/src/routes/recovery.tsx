import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Bar,
  Btn,
  Check,
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
  toneForStatus,
} from "@/components/fx/ui";
import { deletedFiles, recoverySummary } from "@/lib/mock-data";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Video Recovery — OmniSurv Deleted Footage Carving" },
      {
        name: "description",
        content:
          "Recover deleted and fragmented surveillance recordings with recoverability scoring across camera channels.",
      },
      { property: "og:title", content: "Video Recovery — OmniSurv" },
      {
        property: "og:description",
        content: "Deleted, corrupted and recoverable recording candidates with batch recovery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecoveryPage,
});

function RecoveryPage() {
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  useEffect(() => {
    if (!open) return;
    setPct(0);
    setDone(false);
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          setDone(true);
          return 100;
        }
        return p + 5;
      });
    }, 120);
    return () => clearInterval(t);
  }, [open]);

  const allSelected = sel.length === deletedFiles.length;

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / Recovery"
        title="VIDEO RECOVERY"
        subtitle="EV-00127 · deleted and fragmented recording candidates"
        actions={
          <Btn variant="solid" disabled={sel.length === 0} onClick={() => setOpen(true)}>
            Recover selected ({sel.length})
          </Btn>
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-5">
        {recoverySummary.map((s) => (
          <div key={s.label} className="bg-card px-4 py-4">
            <Label>{s.label}</Label>
            <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <Panel className="mt-8">
        <SectionTitle
          right={
            <Btn
              variant="ghost"
              onClick={() => setSel(allSelected ? [] : deletedFiles.map((f) => f.id))}
            >
              {allSelected ? "Clear selection" : "Select all"}
            </Btn>
          }
        >
          Deleted evidence candidates
        </SectionTitle>
        <TableWrap>
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr>
                <Th className="w-10" />
                <Th>File</Th>
                <Th>Camera</Th>
                <Th>Timestamp</Th>
                <Th>Size</Th>
                <Th>Status</Th>
                <Th>Recoverability</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {deletedFiles.map((f) => (
                <Tr key={f.id}>
                  <Td>
                    <Check checked={sel.includes(f.id)} onChange={() => toggle(f.id)} />
                  </Td>
                  <Td mono className="font-medium">{f.file}</Td>
                  <Td mono>{f.camera}</Td>
                  <Td mono className="whitespace-nowrap text-text-secondary">{f.timestamp}</Td>
                  <Td mono>{f.size}</Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(f.status)}>{f.status}</StatusBadge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Bar
                        className="w-24"
                        pct={f.recoverability}
                        tone={f.recoverability > 70 ? "verified" : f.recoverability > 35 ? "event" : "navy"}
                      />
                      <span className="font-mono text-xs tabular-nums">{f.recoverability}%</span>
                    </div>
                  </Td>
                  <Td>
                    <Btn variant="ghost" onClick={() => { setSel([f.id]); setOpen(true); }}>
                      Recover
                    </Btn>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-2.5">
          <span className="label-mono">{sel.length} selected</span>
          <span className="label-mono">Carving engine · demo</span>
        </div>
      </Panel>

      <div className="mt-8">
        <DemoNote>Recovery is simulated in the prototype. No carving is performed.</DemoNote>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        crumb="Recovery / Batch"
        title={done ? "Recovery completed" : "Recovery in progress"}
        footer={
          <Btn variant="solid" onClick={() => setOpen(false)}>
            {done ? "Close" : "Run in background"}
          </Btn>
        }
      >
        <div className="flex items-end justify-between">
          <span className="text-4xl font-extrabold tabular-nums">{pct}%</span>
          <span className="label-mono">{sel.length} files queued</span>
        </div>
        <Bar className="mt-4 h-2" pct={pct} tone={done ? "verified" : "ink"} />
        <div className="mt-5 font-mono text-[11px] leading-6 text-text-secondary">
          <div>Rebuilding frame index from recorder database…</div>
          <div>Carving H.264 / H.265 stream boundaries…</div>
          <div className={done ? "text-verified" : ""}>
            {done ? "Recovered files written to EVIDENCE_DVR_001/RECOVERED" : "Validating container headers…"}
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
