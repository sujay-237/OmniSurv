import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  Field,
  Label,
  Modal,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  TextInput,
} from "@/components/fx/ui";

export const Route = createFileRoute("/cases/new")({
  head: () => ({
    meta: [
      { title: "Create Case — OmniSurv Investigation Intake" },
      {
        name: "description",
        content:
          "Register a new DVR/NVR forensic investigation: incident type, location, investigator, incident date and priority.",
      },
      { property: "og:title", content: "Create Case — OmniSurv" },
      {
        property: "og:description",
        content: "Structured intake form for registering a new forensic investigation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewCasePage,
});

function NewCasePage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    id: "CASE-2026-015",
    name: "",
    incidentType: "Unauthorized Access",
    location: "",
    investigator: "INV-001 / A. Raghavan",
    date: "2026-09-26",
    time: "14:20",
    priority: "HIGH",
    description: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AppShell>
      <PageHeader
        crumb="Investigation / Cases / New"
        title="CREATE CASE"
        subtitle="Investigation intake record"
        actions={
          <Link to="/cases">
            <Btn>Back to registry</Btn>
          </Link>
        }
      />

      <form
        className="mt-8 max-w-4xl"
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <Panel>
          <SectionTitle>01 — Case identification</SectionTitle>
          <div className="grid grid-cols-1 gap-5 px-4 py-5 md:grid-cols-2">
            <Field label="Case ID" hint="Auto-sequenced">
              <TextInput value={form.id} onChange={(e) => set("id")(e.target.value)} />
            </Field>
            <Field label="Case Name">
              <TextInput
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                placeholder="e.g. Unauthorized Access Investigation"
              />
            </Field>
            <Field label="Incident Type">
              <Select
                value={form.incidentType}
                onChange={set("incidentType")}
                className="w-full"
                options={[
                  "Unauthorized Access",
                  "Theft",
                  "Assault",
                  "Hit & Run",
                  "Trespass",
                  "Evidence Tampering",
                  "Other",
                ]}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={set("priority")}
                className="w-full"
                options={["CRITICAL", "HIGH", "MEDIUM", "LOW"]}
              />
            </Field>
          </div>

          <SectionTitle>02 — Incident particulars</SectionTitle>
          <div className="grid grid-cols-1 gap-5 px-4 py-5 md:grid-cols-2">
            <Field label="Location">
              <TextInput
                value={form.location}
                onChange={(e) => set("location")(e.target.value)}
                placeholder="Sector 21, Warehouse Block C"
              />
            </Field>
            <Field label="Investigator">
              <Select
                value={form.investigator}
                onChange={set("investigator")}
                className="w-full"
                options={[
                  "INV-001 / A. Raghavan",
                  "INV-002 / K. Iyer",
                  "INV-004 / S. Mehta",
                  "INV-005 / P. Nair",
                ]}
              />
            </Field>
            <Field label="Date of Incident">
              <TextInput type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
            </Field>
            <Field label="Time of Incident" hint="UTC">
              <TextInput type="time" value={form.time} onChange={(e) => set("time")(e.target.value)} />
            </Field>
          </div>

          <SectionTitle>03 — Narrative</SectionTitle>
          <div className="space-y-5 px-4 py-5">
            <div>
              <Label className="mb-2">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={4}
                placeholder="Summary of the reported incident and scope of surveillance to be examined."
                className="w-full border border-hairline bg-card px-3 py-2 font-mono text-xs outline-none placeholder:text-text-tertiary focus:border-navy"
              />
            </div>
            <div>
              <Label className="mb-2">Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                rows={3}
                placeholder="Handling instructions, seizure remarks, custody observations."
                className="w-full border border-hairline bg-card px-3 py-2 font-mono text-xs outline-none placeholder:text-text-tertiary focus:border-navy"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-hairline bg-surface px-4 py-4">
            <Btn type="button" onClick={() => navigate({ to: "/cases" })}>
              Cancel
            </Btn>
            <Btn variant="solid" type="submit">
              Create case
            </Btn>
          </div>
        </Panel>
      </form>

      <Modal
        open={done}
        onClose={() => setDone(false)}
        crumb="Case / Created"
        title={`${form.id} registered`}
        footer={
          <>
            <Btn onClick={() => setDone(false)}>Stay here</Btn>
            <Btn variant="solid" onClick={() => navigate({ to: "/cases" })}>
              Open registry
            </Btn>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          The case record was created in local prototype state only. Nothing is persisted —
          this frontend has no backend.
        </p>
      </Modal>
    </AppShell>
  );
}
