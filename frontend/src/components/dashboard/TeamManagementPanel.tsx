import { FormEvent, useEffect, useState } from "react";
import { PasswordCriteriaList } from "../auth/PasswordCriteriaList";
import type { CreateUserPayload, TeamUser, UpdateUserPayload, UserRole } from "../../types";

interface TeamManagementPanelProps {
  users: TeamUser[];
  currentUserId: string;
  canManage: boolean;
  createUserError?: string | null;
  createdCredential?: { email: string; temporaryPassword: string } | null;
  onCreateUser: (payload: CreateUserPayload) => Promise<void>;
  onUpdateUser: (userId: string, payload: UpdateUserPayload) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export function TeamManagementPanel({
  users,
  currentUserId,
  canManage,
  createUserError,
  createdCredential,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: TeamManagementPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [managerId, setManagerId] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [memberAssignmentDrafts, setMemberAssignmentDrafts] = useState<Record<string, string>>({});
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [managerDrafts, setManagerDrafts] = useState<Record<string, string>>({});
  const managers = users.filter((user) => user.role === "MANAGER");
  const members = users.filter((user) => user.role === "MEMBER");
  const pmos = users.filter((user) => user.role === "PMO");
  const admins = users.filter((user) => user.role === "ADMIN");
  const groupedUsers: Array<{
    role: UserRole;
    title: string;
    description: string;
    users: TeamUser[];
    tone: string;
  }> = [
    {
      role: "ADMIN",
      title: "Admin Block",
      description: "Workspace owners with full access to users, permissions, and delivery operations.",
      users: admins,
      tone: "border-cyan-500/20 bg-cyan-500/10 text-cyan-100",
    },
    {
      role: "PMO",
      title: "PMO Block",
      description: "Program leaders who oversee assignments, delivery flow, and reporting across teams.",
      users: pmos,
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-100",
    },
    {
      role: "MANAGER",
      title: "Manager Block",
      description: "Team managers who create work, guide execution, and own their member rosters.",
      users: managers,
      tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    },
    {
      role: "MEMBER",
      title: "Member Block",
      description: "Execution-focused contributors assigned under managers and responsible for task delivery.",
      users: members,
      tone: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100",
    },
  ];

  useEffect(() => {
    setRoleDrafts(Object.fromEntries(users.map((user) => [user.id, user.role])) as Record<string, UserRole>);
    setManagerDrafts(Object.fromEntries(users.map((user) => [user.id, user.managerId || ""])) as Record<string, string>);
    setMemberAssignmentDrafts(
      Object.fromEntries(users.filter((user) => user.role === "MEMBER").map((user) => [user.id, user.managerId || ""]))
    );
  }, [users]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateUser({
      name,
      email,
      role,
      managerId: role === "MEMBER" ? managerId || null : null,
      temporaryPassword: temporaryPassword.trim() || undefined,
    });
    setName("");
    setEmail("");
    setRole("MEMBER");
    setManagerId("");
    setTemporaryPassword("");
    setShowTemporaryPassword(false);
  }

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{canManage ? "User CRM" : "Team Directory"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {canManage
            ? "Create accounts, maintain RBAC roles, and map members into the correct manager-owned teams."
            : "Managers can inspect the roster and task ownership distribution."}
        </p>
      </div>

      {canManage ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Create Workspace User</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Admin can create Admin, PMO, Manager, and Member accounts. You can set a temporary password here or let the system generate one automatically.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">Admins {users.filter((user) => user.role === "ADMIN").length}</span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">PMO {pmos.length}</span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">Managers {managers.length}</span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">Members {members.length}</span>
              </div>
            </div>

            <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleSubmit}>
              <input className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500" onChange={(event) => setName(event.target.value)} placeholder="Full name" required value={name} />
              <input className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500" onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required type="email" value={email} />
              <select className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500" onChange={(event) => setRole(event.target.value as UserRole)} value={role}>
                <option value="ADMIN">Admin</option>
                <option value="PMO">PMO</option>
                <option value="MANAGER">Manager</option>
                <option value="MEMBER">Member</option>
              </select>
              <select
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                disabled={role !== "MEMBER"}
                onChange={(event) => setManagerId(event.target.value)}
                value={managerId}
              >
                <option value="">{role === "MEMBER" ? "Assign manager" : "Manager not needed"}</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 pr-11 text-sm text-white outline-none focus:border-teal-500"
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  placeholder="Temporary password (optional)"
                  type={showTemporaryPassword ? "text" : "password"}
                  value={temporaryPassword}
                />
                <button
                  aria-label={showTemporaryPassword ? "Hide temporary password" : "Show temporary password"}
                  className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-lg px-2 text-slate-400 transition hover:text-slate-200"
                  onClick={() => setShowTemporaryPassword((current) => !current)}
                  type="button"
                >
                  {showTemporaryPassword ? (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path d="m3 3 18 18M10.6 10.7A3 3 0 0 0 13.3 13.4M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 4 10 7-0.4 1.2-1.2 2.5-2.3 3.7M6.1 6.1C3.9 7.4 2.5 9.3 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <PasswordCriteriaList password={temporaryPassword} />
              </div>
              <button className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 xl:justify-self-start" type="submit">
                Create user
              </button>
            </form>
            {createUserError ? (
              <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {createUserError}
              </p>
            ) : null}
            {createdCredential ? (
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-50">
                <p className="font-semibold text-white">Temporary password created</p>
                <p className="mt-2 text-amber-100">
                  Share these credentials securely. The user will be forced to reset the password on first login.
                </p>
                <p className="mt-3">
                  <span className="font-semibold text-white">Email:</span> {createdCredential.email}
                </p>
                <p className="mt-1 break-all">
                  <span className="font-semibold text-white">Temporary password:</span> {createdCredential.temporaryPassword}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Team Assignment Center</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Assign members to managers from one place and keep each manager’s team roster visible.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                Unassigned Members {members.filter((member) => !member.managerId).length}
              </span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {managers.map((manager) => {
                const teamMembers = members.filter((member) => member.managerId === manager.id);
                return (
                  <article key={manager.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-white">{manager.name}</h4>
                        <p className="mt-1 text-sm text-slate-400">{manager.email}</p>
                      </div>
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                        {teamMembers.length} members
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <select
                        className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                        onChange={(event) =>
                          setMemberAssignmentDrafts((current) => ({
                            ...current,
                            [manager.id]: event.target.value,
                          }))
                        }
                        value={memberAssignmentDrafts[manager.id] || ""}
                      >
                        <option value="">Select member to assign</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                            {member.manager ? ` - ${member.manager.name}` : " - Unassigned"}
                          </option>
                        ))}
                      </select>
                      <button
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        disabled={!memberAssignmentDrafts[manager.id]}
                        onClick={async () => {
                          const memberId = memberAssignmentDrafts[manager.id];
                          if (!memberId) return;
                          await onUpdateUser(memberId, { managerId: manager.id });
                          setMemberAssignmentDrafts((current) => ({
                            ...current,
                            [manager.id]: "",
                          }));
                        }}
                        type="button"
                      >
                        Assign member
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {teamMembers.length ? (
                        teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{member.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{member.email}</p>
                            </div>
                            <button
                              className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:bg-slate-800"
                              onClick={() => onUpdateUser(member.id, { managerId: null })}
                              type="button"
                            >
                              Unassign
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-4 text-sm text-slate-400">
                          No members are assigned to this manager yet.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        {groupedUsers.map((group) => (
          <section key={group.role} className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${group.tone}`}>
                    {group.users.length} users
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{group.description}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {group.users.length ? (
                group.users.map((user) => (
                  <article key={user.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{user.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                        {user.manager ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Manager {user.manager.name}</p>
                        ) : null}
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${group.tone}`}>
                        {user.role}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs uppercase tracking-[0.18em] text-slate-400 sm:grid-cols-2">
                      <span>Assigned {user._count?.assignedTasks ?? 0}</span>
                      <span>Created {user._count?.createdTasks ?? 0}</span>
                    </div>

                    {canManage ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <select
                          className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                          disabled={user.id === currentUserId}
                          onChange={(event) =>
                            setRoleDrafts((current) => ({
                              ...current,
                              [user.id]: event.target.value as UserRole,
                            }))
                          }
                          value={roleDrafts[user.id] || user.role}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="PMO">PMO</option>
                          <option value="MANAGER">Manager</option>
                          <option value="MEMBER">Member</option>
                        </select>
                        <select
                          className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                          disabled={user.id === currentUserId || (roleDrafts[user.id] || user.role) !== "MEMBER"}
                          onChange={(event) =>
                            setManagerDrafts((current) => ({
                              ...current,
                              [user.id]: event.target.value,
                            }))
                          }
                          value={managerDrafts[user.id] || ""}
                        >
                          <option value="">
                            {(roleDrafts[user.id] || user.role) === "MEMBER" ? "Assign manager" : "Manager not needed"}
                          </option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                          disabled={
                            user.id === currentUserId ||
                            ((roleDrafts[user.id] || user.role) === user.role &&
                              (managerDrafts[user.id] || "") === (user.managerId || ""))
                          }
                          onClick={() =>
                            onUpdateUser(user.id, {
                              role: roleDrafts[user.id],
                              managerId:
                                (roleDrafts[user.id] || user.role) === "MEMBER" ? managerDrafts[user.id] || null : null,
                            })
                          }
                          type="button"
                        >
                          Save access
                        </button>
                        {user.id !== currentUserId ? (
                          <button
                            className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                            onClick={() => onDeleteUser(user.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 px-5 py-8 text-sm text-slate-400">
                  No users in this role yet.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
