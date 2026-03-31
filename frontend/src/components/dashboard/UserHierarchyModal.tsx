import { useEffect } from "react";
import type { TeamUser, User } from "../../types";

interface UserHierarchyModalProps {
  currentUser: User;
  users: TeamUser[];
  onClose: () => void;
}

function OrgCard({
  title,
  subtitle,
  tone,
  compact = false,
}: {
  title: string;
  subtitle: string;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-center shadow-lg shadow-black/20 ${tone} ${
        compact ? "min-w-[180px]" : "min-w-[220px]"
      }`}
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">{subtitle}</p>
    </div>
  );
}

function ConnectorDown() {
  return <div className="h-8 w-px bg-slate-700" />;
}

function HorizontalConnector() {
  return <div className="h-px w-full bg-slate-700" />;
}

export function UserHierarchyModal({ currentUser, users, onClose }: UserHierarchyModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const admins = users.filter((user) => user.role === "ADMIN");
  const pmos = users.filter((user) => user.role === "PMO");
  const managers = users.filter((user) => user.role === "MANAGER");
  const members = users.filter((user) => user.role === "MEMBER");
  const unassignedMembers = members.filter((member) => !member.managerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <button aria-label="Close hierarchy" className="absolute inset-0" onClick={onClose} type="button" />

      <section className="relative z-10 flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98)_0%,_rgba(2,6,23,0.98)_100%)] shadow-2xl shadow-black/40">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Flowchart View</p>
            <h2 className="mt-2 text-3xl font-black text-white">Workspace Hierarchy</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              This flowchart maps the user structure by level so you can quickly understand the workspace chain of command and
              manager-to-member reporting relationships.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
              Viewing as {currentUser.role}
            </span>
            <button
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <div className="rounded-[28px] border border-slate-800 bg-slate-950/50 p-5">
            <div className="overflow-x-auto pb-3">
              <div className="mx-auto flex min-w-[980px] flex-col items-center">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {admins.length ? (
                    admins.map((admin) => (
                      <OrgCard
                        key={admin.id}
                        title={admin.name}
                        subtitle={`ADMIN | ${admin.email}`}
                        tone="border-cyan-400/20 bg-cyan-500/10"
                      />
                    ))
                  ) : (
                    <OrgCard title="No Admin Found" subtitle="ADMIN LEVEL" tone="border-cyan-400/20 bg-cyan-500/10" />
                  )}
                </div>

                <ConnectorDown />

                <div className="w-[78%]">
                  <HorizontalConnector />
                </div>

                <div className="flex w-[78%] justify-center">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {pmos.length ? (
                      pmos.map((pmo) => (
                        <OrgCard
                          key={pmo.id}
                          title={pmo.name}
                          subtitle={`PMO | ${pmo.email}`}
                          tone="border-amber-400/20 bg-amber-500/10"
                        />
                      ))
                    ) : (
                      <OrgCard title="No PMO Found" subtitle="PMO LEVEL" tone="border-amber-400/20 bg-amber-500/10" />
                    )}
                  </div>
                </div>

                <ConnectorDown />

                <div className="w-[86%]">
                  <HorizontalConnector />
                </div>

                <div className="flex w-[86%] justify-center">
                  <div className="grid w-full gap-6 xl:grid-cols-2">
                    {managers.length ? (
                      managers.map((manager) => {
                        const teamMembers = members.filter((member) => member.managerId === manager.id);

                        return (
                          <article key={manager.id} className="flex flex-col items-center">
                            <OrgCard
                              title={manager.name}
                              subtitle={`MANAGER | ${manager.email}`}
                              tone="border-emerald-400/20 bg-emerald-500/10"
                            />

                            <ConnectorDown />

                            <div className="w-[85%]">
                              <HorizontalConnector />
                            </div>

                            <div className="mt-4 flex flex-wrap justify-center gap-3">
                              {teamMembers.length ? (
                                teamMembers.map((member) => (
                                  <div key={member.id} className="flex flex-col items-center">
                                    <div className="h-4 w-px bg-slate-700" />
                                    <OrgCard
                                      compact
                                      title={member.name}
                                      subtitle={`MEMBER | ${member.email}`}
                                      tone="border-slate-700 bg-slate-900/80"
                                    />
                                  </div>
                                ))
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="h-4 w-px bg-slate-700" />
                                  <OrgCard
                                    compact
                                    title="No Team Members"
                                    subtitle="MEMBER LEVEL"
                                    tone="border-slate-700 bg-slate-900/80"
                                  />
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="xl:col-span-2 flex justify-center">
                        <OrgCard title="No Managers Found" subtitle="MANAGER LEVEL" tone="border-emerald-400/20 bg-emerald-500/10" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Detached Branch</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Members without a manager are shown separately because they are outside the current reporting tree.
                </p>
              </div>
              <span className="rounded-full border border-fuchsia-400/20 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100">
                {unassignedMembers.length} unassigned
              </span>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {unassignedMembers.length ? (
                unassignedMembers.map((member) => (
                  <OrgCard
                    key={member.id}
                    compact
                    title={member.name}
                    subtitle={`MEMBER | ${member.email}`}
                    tone="border-fuchsia-400/20 bg-slate-950/70"
                  />
                ))
              ) : (
                <OrgCard compact title="No Detached Members" subtitle="ALL MEMBERS ASSIGNED" tone="border-fuchsia-400/20 bg-slate-950/70" />
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
