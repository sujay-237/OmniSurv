import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DefRow,
  DemoNote,
  Dot,
  HashDisplay,
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
import { evidence } from "@/lib/mock-data";

export const Route = createFileRoute("/integrity")({
  head: () => ({
    meta: [
      { title: "Evidence Integrity — OmniSurv Hash Verification" },
      {
        name: "description",
        content:
          "MD5 and SHA-256 generation, verification and comparison for acquired DVR/NVR evidence images and video segments.",
      },
      { property: "og:title", content: "Evidence Integrity — OmniSurv" },
      {
        property: "og:description",
        content: "Hash verification ledger with match, pending and mismatch states.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrityPage,
});

function IntegrityPage() {
  const [sel, setSel] = useState(evidence[0]!);
  const [dialog, setDialog] = useState<null | "generate" | "verify" | "compare" | "export">(null);

  return (
    <AppShell>
      <PageHeader
        crumb="Validation / Integrity & Hashes"
        title="EVIDENCE INTEGRITY"
        subtitle="Hash generation, verification and comparison"
        actions={
          <>
            <Btn onClick={() => setDialog("generate")}>Generate hash</Btn>
            <Btn onClick={() => setDialog("verify")}>Verify</Btn>
            <Btn onClick={() => setDialog("compare")}>Compare</Btn>
            <Btn variant="solid" onClick={() => setDialog("export")}>Export</Btn>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel>
          <SectionTitle right={<span className="label-mono">{evidence.length} items</span>}>
            Integrity ledger
          </SectionTitle>
          <TableWrap>
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <Th>Evidence ID</Th>
                  <Th>File</Th>
                  <Th>Size</Th>
                  <Th>Acquisition time</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((e) => (
                  <Tr
                    key={e.id}
                    onClick={() => setSel(e)}
                    className={sel.id === e.id ? "bg-surface-container" : undefined}
                  >
                    <Td mono className="font-medium">{e.id}</Td>
                    <Td mono>{e.fileName}</Td>
                    <Td mono>{e.size}</Td>
                    <Td mono className="whitespace-nowrap text-text-secondary">{e.acquired}</Td>
                    <Td>
                      <StatusBadge tone={toneForStatus(e.hashStatus)}>{e.hashStatus}</StatusBadge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <div className="space-y-8">
          <Panel>
            <SectionTitle
              right={
                <StatusBadge tone={toneForStatus(sel.hashStatus)}>
                  {sel.hashStatus === "VERIFIED" ? <Dot /> : null} {sel.hashStatus}
                </StatusBadge>
              }
            >
              {sel.id} · verification record
            </SectionTitle>
            <DefRow label="Evidence ID" value={sel.id} />
            <DefRow label="File" value={sel.fileName} />
            <DefRow label="Size" value={sel.size} />
            <DefRow label="Acquisition time" value={sel.acquired} />
            <DefRow label="Algorithm set" value="MD5 + SHA-256" />
            <div className="space-y-3 px-4 py-4">
              <HashDisplay algo="MD5" value={sel.md5} />
              <HashDisplay algo="SHA-256" value={sel.sha256} verified={sel.hashStatus === "VERIFIED"} />
            </div>
            {sel.hashStatus === "MISMATCH" ? (
              <div className="border-t border-hairline bg-danger-bg px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-danger">
                Hash mismatch — evidence quarantined, do not rely on this item
              </div>
            ) : null}
          </Panel>

          <DemoNote>
            Cryptographic Integrity Ledger: Dual MD5 and SHA-256 digests computed over raw bitstream sectors. Zero bit alteration verified for legal admissibility under BSA Sec 63 / IEA Sec 65B and ISO/IEC 27037.
          </DemoNote>
        </div>
      </div>

      <Modal
        open={dialog === "generate"}
        onClose={() => setDialog(null)}
        crumb={`Integrity / ${sel.id}`}
        title="Hash generated"
        footer={<Btn variant="solid" onClick={() => setDialog(null)}>Close</Btn>}
      >
        <div className="space-y-3">
          <HashDisplay algo="MD5" value={sel.md5} />
          <HashDisplay algo="SHA-256" value={sel.sha256} verified />
          <p className="text-sm text-text-secondary">
            Digests recomputed over {sel.size} via streaming SHA-256 & MD5 buffers. Recorded to immutable custody ledger.
          </p>
        </div>
      </Modal>

      <Modal
        open={dialog === "verify"}
        onClose={() => setDialog(null)}
        crumb={`Integrity / ${sel.id}`}
        title={sel.hashStatus === "MISMATCH" ? "Verification failed" : "Verification successful"}
        footer={<Btn variant="solid" onClick={() => setDialog(null)}>Close</Btn>}
      >
        {sel.hashStatus === "MISMATCH" ? (
          <div className="border border-danger bg-danger-bg px-4 py-4 font-mono text-[11px] uppercase tracking-[0.12em] text-danger">
            Source and stored digest differ · item quarantined
          </div>
        ) : (
          <div className="border border-verified bg-verified-bg px-4 py-4 font-mono text-[11px] uppercase tracking-[0.12em] text-verified">
            <Dot /> Source and image digests match · cryptographic integrity intact
          </div>
        )}
      </Modal>

      <Modal
        open={dialog === "compare"}
        onClose={() => setDialog(null)}
        wide
        crumb="Integrity / Compare"
        title="Digest comparison"
        footer={<Btn variant="solid" onClick={() => setDialog(null)}>Close</Btn>}
      >
        <div className="space-y-3">
          <HashDisplay algo="SOURCE SHA-256" value={sel.sha256} />
          <HashDisplay
            algo="IMAGE SHA-256"
            value={sel.hashStatus === "MISMATCH" ? sel.sha256.slice(0, 48) + "0d19c4a7b2e5f186" : sel.sha256}
            verified={sel.hashStatus !== "MISMATCH"}
          />
        </div>
      </Modal>

      <Modal
        open={dialog === "export"}
        onClose={() => setDialog(null)}
        crumb="Integrity / Export"
        title="Export hash manifest"
        footer={
          <>
            <Btn onClick={() => setDialog(null)}>Close</Btn>
            <Btn
              variant="solid"
              onClick={() => {
                const header = "id,fileName,source,type,size,md5,sha256,status\n";
                const rows = evidence
                  .map((e) => `"${e.id}","${e.fileName}","${e.source}","${e.type}","${e.size}","${e.md5}","${e.sha256}","${e.hashStatus}"`)
                  .join("\n");
                const blob = new Blob([header + rows], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `evidence_hash_manifest_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                setDialog(null);
              }}
            >
              Download CSV Manifest
            </Btn>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Export cryptographic manifest of all {evidence.length} evidence digests formatted for courtroom submission.
        </p>
        <div className="mt-4 flex gap-2">
          {["CSV", "JSON"].map((fmt) => (
            <Btn
              key={fmt}
              onClick={() => {
                let content = "";
                let mime = "text/csv";
                if (fmt === "JSON") {
                  content = JSON.stringify(evidence, null, 2);
                  mime = "application/json";
                } else {
                  content =
                    "id,fileName,source,type,size,md5,sha256,status\n" +
                    evidence
                      .map((e) => `"${e.id}","${e.fileName}","${e.source}","${e.type}","${e.size}","${e.md5}","${e.sha256}","${e.hashStatus}"`)
                      .join("\n");
                }
                const blob = new Blob([content], { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `evidence_hash_manifest.${fmt.toLowerCase()}`;
                a.click();
                URL.revokeObjectURL(url);
                setDialog(null);
              }}
            >
              Export {fmt}
            </Btn>
          ))}
        </div>
      </Modal>
    </AppShell>
  );
}
