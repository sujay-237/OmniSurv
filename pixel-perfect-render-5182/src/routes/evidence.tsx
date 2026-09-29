import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DefRow,
  Drawer,
  HashDisplay,
  Modal,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
  TableWrap,
  Td,
  TextInput,
  Th,
  Tr,
  toneForStatus,
} from "@/components/fx/ui";
import { evidence as initialEvidence, type Evidence } from "@/lib/mock-data";
import { api, type EvidenceProgress } from "@/lib/api";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Registry — OmniSurv Evidence Ledger" },
      {
        name: "description",
        content:
          "Evidence ledger of forensic images, video segments and carved fragments with acquisition time, size and hash verification state.",
      },
      { property: "og:title", content: "Evidence Registry — OmniSurv" },
      {
        property: "og:description",
        content: "Search, filter and inspect acquired surveillance evidence items.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvidencePage,
});

const TYPES = ["ALL TYPES", "FORENSIC IMAGE", "VIDEO SEGMENT", "METADATA INDEX", "CARVED FRAGMENT"];
const HASHES = ["ALL HASH STATES", "VERIFIED", "PENDING", "MISMATCH"];

function EvidencePage() {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>(initialEvidence);
  const [q, setQ] = useState("");
  const [type, setType] = useState(TYPES[0]!);
  const [hash, setHash] = useState(HASHES[0]!);
  const [asc, setAsc] = useState(false);
  const [open, setOpen] = useState<Evidence | null>(null);
  const [detail, setDetail] = useState<Evidence | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [activeProgress, setActiveProgress] = useState<EvidenceProgress | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with backend evidence list on mount
  useEffect(() => {
    api.getEvidenceList().then((backendList) => {
      if (backendList && backendList.length > 0) {
        const formatted: Evidence[] = backendList.map((item: any) => ({
          id: item.evidence_id || item.id,
          fileName: item.filename || "disk.dd",
          source: item.vendor ? `${item.vendor} DVR/NVR` : "Surveillance System",
          type: "FORENSIC IMAGE",
          size: item.size_bytes ? `${(item.size_bytes / (1024 * 1024)).toFixed(1)} MB` : "Raw Stream",
          acquired: item.ingest_timestamp ? item.ingest_timestamp.replace("T", " ").slice(0, 19) + " UTC" : "Live Ingest",
          hashStatus: "VERIFIED",
          status: (item.status === "COMPLETED" ? "READY" : item.status) as any,
          md5: item.md5_hash || item.source_file_md5 || "—",
          sha256: item.sha256_hash || item.source_file_sha256 || "—",
          caseId: item.case_id || "CASE-2026-001",
        }));
        setEvidenceList((prev) => {
          const ids = new Set(formatted.map((f) => f.id));
          return [...formatted, ...prev.filter((p) => !ids.has(p.id))];
        });
      }
    }).catch(() => {});
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(`Streaming bitstream & computing MD5/SHA-256 for ${file.name}…`);

    try {
      const resp = await api.uploadEvidence(file);
      setUploadStatus(`Evidence ingested (${resp.detected_vendor}). Carving engine started: ${resp.evidence_id}`);

      const newEntry: Evidence = {
        id: resp.evidence_id,
        fileName: resp.filename,
        source: `${resp.detected_vendor} DVR`,
        type: "FORENSIC IMAGE",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        acquired: "Just now",
        hashStatus: "VERIFIED",
        status: "PROCESSING",
        md5: resp.md5_hash,
        sha256: resp.sha256_hash,
        caseId: "CASE-2026-001",
      };

      setEvidenceList((prev) => [newEntry, ...prev]);

      // Poll progress for up to 60 seconds
      let attempts = 0;
      const timer = setInterval(async () => {
        attempts++;
        try {
          const prog = await api.getEvidenceProgress(resp.evidence_id);
          setActiveProgress(prog);
          if (prog.status === "COMPLETED" || prog.status === "FAILED" || attempts > 60) {
            clearInterval(timer);
            setUploading(false);
            setEvidenceList((prev) =>
              prev.map((e) => (e.id === resp.evidence_id ? { ...e, status: prog.status === "COMPLETED" ? "READY" : "QUARANTINED" } : e))
            );
          }
        } catch {
          if (attempts > 30) clearInterval(timer);
        }
      }, 1500);

    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return evidenceList
      .filter((e) => (term ? `${e.id} ${e.fileName} ${e.source} ${e.type}`.toLowerCase().includes(term) : true))
      .filter((e) => (type === TYPES[0]! ? true : e.type === type))
      .filter((e) => (hash === HASHES[0]! ? true : e.hashStatus === hash))
      .sort((a, b) => (asc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
  }, [q, type, hash, asc, evidenceList]);

  return (
    <AppShell>
      <PageHeader
        crumb="Investigation / Evidence"
        title="EVIDENCE REGISTRY"
        subtitle="Acquired evidence ledger & ISO/IEC 27037 verification"
        actions={
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".dd,.raw,.img,.bin,.mp4,.h264,.h265"
            />
            <Btn
              variant="solid"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Ingesting & Carving…" : "+ Upload Forensic Image (.dd/.raw)"}
            </Btn>
            <Link to="/acquisition">
              <Btn>Acquisition</Btn>
            </Link>
            <Link to="/integrity">
              <Btn>Integrity</Btn>
            </Link>
          </div>
        }
      />

      {uploadStatus && (
        <div className="mt-4 rounded border border-hairline bg-surface p-4 text-xs font-mono text-foreground flex items-center justify-between">
          <div>
            <span className="font-semibold text-event">FORENSIC INGESTION: </span>
            {uploadStatus}
          </div>
          {activeProgress && (
            <div className="flex items-center gap-4">
              <span>Scanned: {activeProgress.progress_percent.toFixed(1)}%</span>
              <span>Hits: {activeProgress.signatures_found}</span>
              <span>Clips: {activeProgress.clips_recovered}</span>
            </div>
          )}
        </div>
      )}

      <Panel className="mt-8">
        <div className="grid grid-cols-1 gap-3 border-b border-hairline px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search evidence ID, file name, source…" />
          <Select value={type} onChange={setType} options={TYPES} />
          <Select value={hash} onChange={setHash} options={HASHES} />
          <Btn onClick={() => setAsc((a) => !a)}>Sort {asc ? "↑" : "↓"}</Btn>
        </div>

        <TableWrap>
          <table className="w-full min-w-[1040px] border-collapse">
            <thead>
              <tr>
                <Th>Evidence ID</Th>
                <Th>File Name</Th>
                <Th>Source</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Acquired</Th>
                <Th>Hash Status</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Tr key={e.id}>
                  <Td mono className="font-medium">{e.id}</Td>
                  <Td mono>{e.fileName}</Td>
                  <Td mono className="text-text-secondary">{e.source}</Td>
                  <Td className="whitespace-nowrap text-text-secondary">{e.type}</Td>
                  <Td mono>{e.size}</Td>
                  <Td mono className="whitespace-nowrap text-text-secondary">{e.acquired}</Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(e.hashStatus)}>{e.hashStatus}</StatusBadge>
                  </Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(e.status)}>{e.status}</StatusBadge>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Btn variant="ghost" onClick={() => setOpen(e)}>Open</Btn>
                      <Btn variant="ghost" onClick={() => setDetail(e)}>Details</Btn>
                      <a
                        href={api.getReportDownloadUrl(e.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex"
                      >
                        <Btn variant="ghost">Report (PDF)</Btn>
                      </a>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>

        <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-2.5">
          <span className="label-mono">{rows.length} of {evidenceList.length} items</span>
          <span className="label-mono">Connected to OmniSurv Forensic Engine API (Port 8000)</span>
        </div>
      </Panel>

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        wide
        crumb={`Evidence / ${open?.id ?? ""}`}
        title={open?.fileName ?? ""}
        footer={
          <>
            <Btn onClick={() => setOpen(null)}>Close</Btn>
            <a
              href={open ? api.getReportDownloadUrl(open.id) : "#"}
              target="_blank"
              rel="noreferrer"
            >
              <Btn>Download Court PDF</Btn>
            </a>
            <Link to="/recovery">
              <Btn variant="solid">Carve & Recover</Btn>
            </Link>
          </>
        }
      >
        {open ? (
          <div className="space-y-5">
            <div className="border border-hairline">
              <DefRow label="Evidence ID" value={open.id} />
              <DefRow label="Source" value={open.source} />
              <DefRow label="Type" value={open.type} />
              <DefRow label="Size" value={open.size} />
              <DefRow label="Acquired" value={open.acquired} />
              <DefRow label="Case" value={open.caseId} />
            </div>
            <HashDisplay algo="MD5" value={open.md5} />
            <HashDisplay algo="SHA-256" value={open.sha256} verified={open.hashStatus === "VERIFIED"} />
          </div>
        ) : null}
      </Modal>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={`Evidence inspector · ${detail?.id ?? ""}`}>
        {detail ? (
          <div>
            <div className="border-b border-hairline px-5 py-4">
              <div className="font-mono text-sm">{detail.fileName}</div>
              <div className="mt-2 flex gap-2">
                <StatusBadge tone={toneForStatus(detail.hashStatus)}>{detail.hashStatus}</StatusBadge>
                <StatusBadge tone={toneForStatus(detail.status)}>{detail.status}</StatusBadge>
              </div>
            </div>
            <SectionTitle>Metadata</SectionTitle>
            <DefRow label="Source device" value={detail.source} />
            <DefRow label="Type" value={detail.type} />
            <DefRow label="Size" value={detail.size} />
            <DefRow label="Acquired" value={detail.acquired} />
            <DefRow label="Case" value={detail.caseId} />
            <div className="space-y-3 px-5 py-5">
              <HashDisplay algo="MD5" value={detail.md5} />
              <HashDisplay algo="SHA-256" value={detail.sha256} verified={detail.hashStatus === "VERIFIED"} />
            </div>
            <div className="p-5">
              <a
                href={api.getReportDownloadUrl(detail.id)}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-block"
              >
                <Btn variant="solid" className="w-full text-center">
                  Generate Admissible PDF Report
                </Btn>
              </a>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
