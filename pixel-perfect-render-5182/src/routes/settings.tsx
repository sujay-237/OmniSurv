import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  Check,
  DefRow,
  DemoNote,
  Field,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
  TextInput,
} from "@/components/fx/ui";
import { oemMatrix } from "@/lib/mock-data";
import { toneForStatus } from "@/components/fx/ui";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OmniSurv Workstation Configuration" },
      {
        name: "description",
        content:
          "Configure account, security, evidence handling, hashing algorithms, notifications, OEM support and system preferences.",
      },
      { property: "og:title", content: "Settings — OmniSurv" },
      {
        property: "og:description",
        content: "Workstation configuration for evidence handling, hashing and access security.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS = ["ACCOUNT", "SECURITY", "EVIDENCE", "HASHING", "NOTIFICATIONS", "OEM SUPPORT", "SYSTEM"];

function SettingsPage() {
  const [section, setSection] = useState(SECTIONS[0]!);
  const [md5, setMd5] = useState(true);
  const [sha, setSha] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);
  const [readOnly, setReadOnly] = useState(true);
  const [mfa, setMfa] = useState(true);
  const [notify, setNotify] = useState(["ACQUISITION", "INTEGRITY", "RECOVERY"]);
  const [timezone, setTimezone] = useState("UTC");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("omnisurv-theme", next ? "dark" : "light");
  };

  return (
    <AppShell>
      <PageHeader
        crumb="System / Settings"
        title="SETTINGS"
        subtitle="Workstation configuration"
        actions={
          <div className="flex gap-2">
            <Btn onClick={toggleDark}>{dark ? "☀ Light mode" : "☾ Dark mode"}</Btn>
            <Btn variant="solid">Save changes</Btn>
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Panel className="h-max">
          <SectionTitle>Sections</SectionTitle>
          <div className="py-2">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={
                  "block w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.14em] transition-colors " +
                  (section === s ? "bg-foreground text-background" : "hover:bg-background")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-8">
          {section === "ACCOUNT" ? (
            <Panel>
              <SectionTitle>Account</SectionTitle>
              <div className="grid grid-cols-1 gap-5 px-4 py-5 md:grid-cols-2">
                <Field label="Investigator ID">
                  <TextInput defaultValue="INV-001" readOnly />
                </Field>
                <Field label="Full name">
                  <TextInput defaultValue="A. Raghavan" />
                </Field>
                <Field label="Unit">
                  <TextInput defaultValue="Cyber Forensics Division" />
                </Field>
                <Field label="Contact">
                  <TextInput defaultValue="inv001@forensic-x.demo" />
                </Field>
              </div>
            </Panel>
          ) : null}

          {section === "SECURITY" ? (
            <Panel>
              <SectionTitle>Security</SectionTitle>
              <div className="space-y-4 px-4 py-5">
                <Check checked={mfa} onChange={setMfa} label="Require second factor for evidence export" />
                <Check checked onChange={() => {}} label="Lock session after 15 minutes idle" />
                <Field label="Session policy">
                  <Select
                    value="STRICT · SINGLE DEVICE"
                    onChange={() => {}}
                    options={["STRICT · SINGLE DEVICE", "STANDARD", "EXTENDED"]}
                    className="w-full"
                  />
                </Field>
              </div>
              <DefRow label="Last sign-in" value="26 SEP 2026 09:04 UTC · 10.20.4.18" />
              <DefRow label="Workstation" value="FX-WS-04 (write-blocked)" tone="verified" />
            </Panel>
          ) : null}

          {section === "EVIDENCE" ? (
            <Panel>
              <SectionTitle>Evidence handling</SectionTitle>
              <div className="space-y-4 px-4 py-5">
                <Check checked={readOnly} onChange={setReadOnly} label="Enforce read-only source access" />
                <Check checked={autoVerify} onChange={setAutoVerify} label="Verify hash immediately after acquisition" />
                <Field label="Evidence store">
                  <TextInput defaultValue="/forensic-store/case-2026" />
                </Field>
                <Field label="Image format">
                  <Select value="E01 · SEGMENTED 4 GB" onChange={() => {}} options={["E01 · SEGMENTED 4 GB", "RAW / DD", "AFF4"]} className="w-full" />
                </Field>
              </div>
            </Panel>
          ) : null}

          {section === "HASHING" ? (
            <Panel>
              <SectionTitle>Hashing</SectionTitle>
              <div className="space-y-4 px-4 py-5">
                <Check checked={md5} onChange={setMd5} label="MD5" />
                <Check checked={sha} onChange={setSha} label="SHA-256" />
                <Check checked={false} onChange={() => {}} label="SHA-512 (slower)" />
                <Field label="Quarantine policy on mismatch">
                  <Select
                    value="IMMEDIATE QUARANTINE"
                    onChange={() => {}}
                    options={["IMMEDIATE QUARANTINE", "FLAG ONLY", "HALT WORKFLOW"]}
                    className="w-full"
                  />
                </Field>
              </div>
              <div className="border-t border-hairline px-4 py-3">
                <StatusBadge tone="verified">Active set · MD5 + SHA-256</StatusBadge>
              </div>
            </Panel>
          ) : null}

          {section === "NOTIFICATIONS" ? (
            <Panel>
              <SectionTitle>Notifications</SectionTitle>
              <div className="space-y-4 px-4 py-5">
                {["ACQUISITION", "INTEGRITY", "RECOVERY", "REPORTS", "USER ACCESS"].map((n) => (
                  <Check
                    key={n}
                    checked={notify.includes(n)}
                    onChange={() =>
                      setNotify((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
                    }
                    label={<span className="font-mono text-[11px] uppercase tracking-[0.12em]">{n}</span>}
                  />
                ))}
              </div>
            </Panel>
          ) : null}

          {section === "OEM SUPPORT" ? (
            <Panel>
              <SectionTitle>OEM support</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {oemMatrix.map((o) => (
                  <div key={o.oem} className="flex items-center justify-between gap-3 border-b border-r border-hairline-light px-4 py-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em]">{o.oem}</span>
                    <StatusBadge tone={toneForStatus(o.status)}>{o.status}</StatusBadge>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {section === "SYSTEM" ? (
            <Panel>
              <SectionTitle>System</SectionTitle>
              <div className="grid grid-cols-1 gap-5 px-4 py-5 md:grid-cols-2">
                <Field label="Timezone" hint="All forensic timestamps are stored in UTC">
                  <Select value={timezone} onChange={setTimezone} options={["UTC", "IST (UTC+5:30)", "LOCAL"]} className="w-full" />
                </Field>
                <Field label="Interface density">
                  <Select value="COMPACT" onChange={() => {}} options={["COMPACT", "COMFORTABLE"]} className="w-full" />
                </Field>
              </div>
              <DefRow label="Build" value="OmniSurv PROTOTYPE 0.9.4 (frontend only)" />
              <DefRow label="Engine" value="NOT CONNECTED — UI PROTOTYPE" />
              <DefRow label="Storage" value="NOT CONNECTED — UI PROTOTYPE" />
            </Panel>
          ) : null}

          <DemoNote>Settings are local prototype state and are not persisted.</DemoNote>
        </div>
      </div>
    </AppShell>
  );
}

