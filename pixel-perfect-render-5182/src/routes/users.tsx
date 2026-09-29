import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
  Field,
  Label,
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
import { users as seedUsers } from "@/lib/mock-data";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — OmniSurv Access Control" },
      {
        name: "description",
        content:
          "Administrator, investigator, reviewer and viewer accounts with role assignment and activity state.",
      },
      { property: "og:title", content: "Users & Roles — OmniSurv" },
      {
        property: "og:description",
        content: "Role-based access roster for the forensic workstation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

const ROLES = ["ADMIN", "INVESTIGATOR", "REVIEWER", "VIEWER"];

function UsersPage() {
  const [rows, setRows] = useState(seedUsers);
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<(typeof seedUsers)[number] | null>(null);
  const [draft, setDraft] = useState({ id: "INV-006", name: "", role: "INVESTIGATOR" });

  return (
    <AppShell>
      <PageHeader
        crumb="System / Users & Roles"
        title="USERS & ROLES"
        subtitle="Role-based access roster"
        actions={<Btn variant="solid" onClick={() => setCreate(true)}>Create user</Btn>}
      />

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-4">
        {ROLES.map((r) => (
          <div key={r} className="bg-card px-4 py-4">
            <Label>{r}</Label>
            <div className="mt-3 text-3xl font-extrabold tabular-nums">
              {String(rows.filter((u) => u.role === r).length).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      <Panel className="mt-8">
        <SectionTitle right={<span className="label-mono">{rows.length} accounts</span>}>
          Accounts
        </SectionTitle>
        <TableWrap>
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <Th>User ID</Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Last Active</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <Tr key={u.id}>
                  <Td mono className="font-medium">{u.id}</Td>
                  <Td>{u.name}</Td>
                  <Td mono>{u.role}</Td>
                  <Td mono className="whitespace-nowrap text-text-secondary">{u.lastActive}</Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(u.status)}>{u.status}</StatusBadge>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Btn variant="ghost" onClick={() => setEdit(u)}>Edit</Btn>
                      <Btn
                        variant="ghost"
                        onClick={() =>
                          setRows((s) =>
                            s.map((x) =>
                              x.id === u.id
                                ? { ...x, status: x.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }
                                : x,
                            ),
                          )
                        }
                      >
                        {u.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Btn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <div className="mt-8">
        <DemoNote>Roster is local prototype state — no accounts or permissions exist.</DemoNote>
      </div>

      <Modal
        open={create}
        onClose={() => setCreate(false)}
        crumb="Users / Create"
        title="Create user"
        footer={
          <>
            <Btn onClick={() => setCreate(false)}>Cancel</Btn>
            <Btn
              variant="solid"
              onClick={() => {
                setRows((s) => [
                  ...s,
                  {
                    id: draft.id,
                    name: draft.name || "Unnamed operator",
                    role: draft.role,
                    lastActive: "—",
                    status: "ACTIVE",
                  },
                ]);
                setCreate(false);
              }}
            >
              Create
            </Btn>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="User ID">
            <TextInput value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </Field>
          <Field label="Name">
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="R. Kulkarni"
            />
          </Field>
          <Field label="Role">
            <Select value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} options={ROLES} className="w-full" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        crumb={`Users / ${edit?.id ?? ""}`}
        title="Edit user"
        footer={
          <>
            <Btn onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn
              variant="solid"
              onClick={() => {
                if (edit) setRows((s) => s.map((x) => (x.id === edit.id ? edit : x)));
                setEdit(null);
              }}
            >
              Save
            </Btn>
          </>
        }
      >
        {edit ? (
          <div className="space-y-5">
            <Field label="User ID">
              <TextInput value={edit.id} readOnly />
            </Field>
            <Field label="Name">
              <TextInput value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Role">
              <Select value={edit.role} onChange={(v) => setEdit({ ...edit, role: v })} options={ROLES} className="w-full" />
            </Field>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
