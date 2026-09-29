import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DefRow,
  Drawer,
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
import { evidenceTree, fsFiles, type FsFile } from "@/lib/mock-data";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "File System — OmniSurv Forensic File Explorer" },
      {
        name: "description",
        content:
          "Browse the parsed recorder file system: system, database, per-camera folders, metadata, recovered and deleted records.",
      },
      { property: "og:title", content: "Forensic File Explorer — OmniSurv" },
      {
        property: "og:description",
        content: "Evidence tree and file table with normal, deleted, corrupted and recovered states.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FilesPage,
});

const STATES = ["ALL STATES", "NORMAL", "DELETED", "CORRUPTED", "RECOVERED", "UNKNOWN"];

function FilesPage() {
  const [node, setNode] = useState("EVIDENCE_DVR_001");
  const [q, setQ] = useState("");
  const [state, setState] = useState(STATES[0]!);
  const [inspect, setInspect] = useState<FsFile | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return fsFiles
      .filter((f) => (term ? `${f.name} ${f.camera} ${f.type}`.toLowerCase().includes(term) : true))
      .filter((f) => (state === STATES[0]! ? true : f.status === state))
      .filter((f) => {
        if (node === "EVIDENCE_DVR_001") return true;
        if (node === "DELETED") return f.status === "DELETED";
        if (node === "RECOVERED") return f.status === "RECOVERED";
        if (node === "DATABASE") return f.type === "DATABASE";
        if (node === "SYSTEM") return f.type === "CONFIG" || f.type === "LOG";
        if (node === "METADATA") return f.type === "FRAGMENT";
        if (node.startsWith("CAMERA_")) return f.camera === `CAM-${node.slice(-2)}`;
        return true;
      });
  }, [q, state, node]);

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / File System"
        title="FORENSIC FILE EXPLORER"
        subtitle="EV-00127 · DVR_IMAGE_001.E01 · parsed file system"
        actions={<Btn>Export file list</Btn>}
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Panel className="h-max">
          <SectionTitle>Evidence tree</SectionTitle>
          <div className="py-2">
            {evidenceTree.map((n) => {
              const active = node === n.name;
              return (
                <button
                  key={n.name}
                  onClick={() => setNode(n.name)}
                  className={
                    "flex w-full items-center justify-between gap-2 px-4 py-2 text-left font-mono text-[11px] transition-colors " +
                    (active ? "bg-foreground text-background" : "text-foreground hover:bg-background")
                  }
                  style={{ paddingLeft: 16 + n.depth * 16 }}
                >
                  <span className="truncate">
                    {n.depth ? "└ " : ""}
                    {n.name}
                  </span>
                  {n.files ? (
                    <span className={active ? "text-background/70" : "text-text-tertiary"}>{n.files}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="grid grid-cols-1 gap-3 border-b border-hairline px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search file name, camera, type…" />
            <Select value={state} onChange={setState} options={STATES} />
          </div>
          <TableWrap>
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Size</Th>
                  <Th>Created</Th>
                  <Th>Modified</Th>
                  <Th>Camera</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <Tr key={f.name} onClick={() => setInspect(f)}>
                    <Td mono className="font-medium">{f.name}</Td>
                    <Td mono className="text-text-secondary">{f.type}</Td>
                    <Td mono>{f.size}</Td>
                    <Td mono className="whitespace-nowrap text-text-secondary">{f.created}</Td>
                    <Td mono className="whitespace-nowrap text-text-secondary">{f.modified}</Td>
                    <Td mono>{f.camera}</Td>
                    <Td>
                      <StatusBadge tone={toneForStatus(f.status)}>{f.status}</StatusBadge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-2.5">
            <span className="label-mono">{node} · {rows.length} entries</span>
            <span className="label-mono">Forensic Filesystem Volume · Read-Only (ISO/IEC 27037)</span>
          </div>
        </Panel>
      </div>

      <Drawer open={!!inspect} onClose={() => setInspect(null)} title="File inspector">
        {inspect ? (
          <div>
            <div className="border-b border-hairline px-5 py-4">
              <div className="font-mono text-sm break-all">{inspect.name}</div>
              <div className="mt-2">
                <StatusBadge tone={toneForStatus(inspect.status)}>{inspect.status}</StatusBadge>
              </div>
            </div>
            <DefRow label="Type" value={inspect.type} />
            <DefRow label="Size" value={inspect.size} />
            <DefRow label="Created" value={inspect.created} />
            <DefRow label="Modified" value={inspect.modified} />
            <DefRow label="Camera" value={inspect.camera} />
            <DefRow label="Source offset" value="0x0000A41C88" />
            <DefRow label="Container" value="EV-00127 / DVR_IMAGE_001.E01" />
            <div className="flex flex-wrap gap-2 px-5 py-5">
              <Btn>Preview</Btn>
              <Btn>Hash file</Btn>
              <Btn variant="solid">Add to findings</Btn>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
