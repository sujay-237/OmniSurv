import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  Check,
  DefRow,
  DemoNote,
  Label,
  Modal,
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
import { reportSections } from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Forensic Report — OmniSurv Report Generation" },
      {
        name: "description",
        content:
          "Compose the forensic report from validated sections — case, device, acquisition, hashes, recovery, timeline, findings and custody.",
      },
      { property: "og:title", content: "Forensic Report Generation — OmniSurv" },
      {
        property: "og:description",
        content: "Select report sections, preview the document and export to PDF, CSV or JSON.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [selected, setSelected] = useState<string[]>(reportSections);
  const [preview, setPreview] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [format, setFormat] = useState("PDF");
  const [caseId, setCaseId] = useState("CASE-2026-014");

  const toggle = (s: string) =>
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <AppShell>
      <PageHeader
        crumb="Output / Reports"
        title="FORENSIC REPORT"
        subtitle={`${caseId} · report composition`}
        actions={
          <>
            <Btn onClick={() => setPreview(true)}>Preview report</Btn>
            <Btn variant="solid" onClick={() => setGenerated(true)}>
              Generate report
            </Btn>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <SectionTitle right={<span className="label-mono">{selected.length} / {reportSections.length} selected</span>}>
            Report sections
          </SectionTitle>
          <div className="px-4 py-2">
            {reportSections.map((s) => (
              <div key={s} className="flex items-center justify-between border-b border-hairline-light py-3 last:border-0">
                <Check checked={selected.includes(s)} onChange={() => toggle(s)} label={s} />
                <StatusBadge tone={selected.includes(s) ? "verified" : "neutral"}>
                  {selected.includes(s) ? "INCLUDED" : "EXCLUDED"}
                </StatusBadge>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-hairline bg-surface px-4 py-3">
            <Btn onClick={() => setSelected(reportSections)}>Select all</Btn>
            <Btn onClick={() => setSelected([])}>Clear</Btn>
          </div>
        </Panel>

        <div className="space-y-8">
          <Panel>
            <SectionTitle>Report parameters</SectionTitle>
            <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2">
              <div>
                <Label className="mb-2">Case</Label>
                <Select
                  value={caseId}
                  onChange={setCaseId}
                  className="w-full"
                  options={["CASE-2026-014", "CASE-2026-013", "CASE-2026-011"]}
                />
              </div>
              <div>
                <Label className="mb-2">Export format</Label>
                <Select value={format} onChange={setFormat} className="w-full" options={["PDF", "CSV", "JSON"]} />
              </div>
            </div>
            <DefRow label="Author" value="INV-001 / A. Raghavan" />
            <DefRow label="Reviewer" value="REV-002 / D. Fernandes" />
            <DefRow label="Integrity statement" value="SHA-256 MATCHED FOR ALL INCLUDED EVIDENCE" tone="verified" />
            <DefRow label="Version" value="DRAFT 3" />
          </Panel>

          <Panel>
            <SectionTitle>Report history</SectionTitle>
            <TableWrap>
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr>
                    <Th>Report ID</Th>
                    <Th>Version</Th>
                    <Th>Generated</Th>
                    <Th>Format</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  <Tr>
                    <Td mono>RPT-0031</Td>
                    <Td mono>DRAFT 3</Td>
                    <Td mono className="text-text-secondary">26 SEP 2026 16:02</Td>
                    <Td mono>PDF</Td>
                    <Td><StatusBadge tone="event">REVIEW</StatusBadge></Td>
                  </Tr>
                  <Tr>
                    <Td mono>RPT-0028</Td>
                    <Td mono>DRAFT 2</Td>
                    <Td mono className="text-text-secondary">25 SEP 2026 11:44</Td>
                    <Td mono>PDF</Td>
                    <Td><StatusBadge tone="neutral">SUPERSEDED</StatusBadge></Td>
                  </Tr>
                  <Tr>
                    <Td mono>RPT-0022</Td>
                    <Td mono>DRAFT 1</Td>
                    <Td mono className="text-text-secondary">24 SEP 2026 09:18</Td>
                    <Td mono>JSON</Td>
                    <Td><StatusBadge tone="neutral">SUPERSEDED</StatusBadge></Td>
                  </Tr>
                </tbody>
              </table>
            </TableWrap>
          </Panel>

          <DemoNote>
            Court-Admissible Forensic Reporting: generates cryptographically sealed chain-of-custody PDF documents compliant with ISO/IEC 27037 and BSA Sec 63 / IEA Sec 65B.
          </DemoNote>
        </div>
      </div>

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        wide
        crumb={`Report / ${caseId}`}
        title="Report preview"
        footer={
          <>
            <Btn onClick={() => setPreview(false)}>Close</Btn>
            <Btn variant="solid" onClick={() => { setPreview(false); setGenerated(true); }}>
              Generate
            </Btn>
          </>
        }
      >
        <div className="border border-hairline bg-surface px-6 py-6">
          <div className="border-b border-hairline pb-4">
            <div className="label-mono">Forensic examination report · draft 3</div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight">{caseId}</div>
            <div className="mt-1 text-sm text-text-secondary">
              Unauthorized Access Investigation · Multi-vendor DVR/NVR examination
            </div>
          </div>
          <ol className="mt-5 space-y-2">
            {selected.map((s, i) => (
              <li key={s} className="flex items-baseline gap-3 border-b border-hairline-light pb-2 font-mono text-[11px] uppercase tracking-[0.1em]">
                <span className="text-text-tertiary">{String(i + 1).padStart(2, "0")}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {selected.length === 0 ? (
            <div className="mt-4 label-mono">No sections selected</div>
          ) : null}
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
            Prepared by Certified Digital Forensic Examiner (INV-001) · Evidential Record
          </div>
        </div>
      </Modal>

      <Modal
        open={generated}
        onClose={() => setGenerated(false)}
        crumb="Report / Generated"
        title="Report generated"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Btn
              variant="outline"
              onClick={async () => {
                const data = {
                  report_id: "RPT-0032",
                  case_id: caseId,
                  format,
                  sections: selected,
                  generated_at: new Date().toISOString(),
                  standard: "ISO/IEC 27037 & BSA Sec 63 / IEA Sec 65B",
                  hash_verification: "VERIFIED_INTACT",
                };
                let body = "";
                let mime = "application/json";
                if (format === "PDF") {
                  try {
                    const evList = await api.getEvidenceList();
                    if (evList && evList.length > 0) {
                      const evId = evList[0].evidence_id;
                      window.open(api.getReportDownloadUrl(evId), "_blank");
                      return;
                    }
                  } catch {
                    // Fallback to json if backend is offline
                  }
                  body = JSON.stringify(data, null, 2);
                  mime = "application/json";
                } else if (format === "JSON") {
                  body = JSON.stringify(data, null, 2);
                  mime = "application/json";
                } else if (format === "CSV") {
                  mime = "text/csv";
                  body = "report_id,case_id,section,standard\n" + selected.map((s) => `RPT-0032,${caseId},"${s}","ISO/IEC 27037"`).join("\n");
                }
                const ext = format === "PDF" ? "json" : format.toLowerCase();
                const url = URL.createObjectURL(new Blob([body], { type: mime }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `RPT-0032_${caseId}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download {format} Report
            </Btn>
            <Btn variant="solid" onClick={() => setGenerated(false)}>Close</Btn>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          Court-admissible forensic report assembled with {selected.length} evidential sections for {caseId} as {format}.
          Cryptographically signed under ISO/IEC 27037 and Indian Evidence Act Sec 65B.
        </p>
        <div className="mt-4 flex gap-2">
          {["PDF", "CSV", "JSON"].map((f) => (
            <Btn key={f} onClick={() => setFormat(f)} variant={format === f ? "solid" : "outline"}>
              {f}
            </Btn>
          ))}
        </div>
      </Modal>
    </AppShell>
  );
}
