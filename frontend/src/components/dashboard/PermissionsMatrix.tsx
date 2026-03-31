const rows = [
  ["Manage users", "Yes", "No", "No", "No"],
  ["Create tasks", "Yes", "Yes", "Yes", "No"],
  ["Assign tasks", "Any team", "Any team", "Own team only", "No"],
  ["Delete tasks", "Yes", "Yes", "Own only", "No"],
  ["Move tasks", "Yes", "Yes", "Own team", "Assigned only"],
  ["Create subtasks", "Yes", "Yes", "Yes", "No"],
  ["AI planning", "Yes", "Yes", "Yes", "View only"],
];

export function PermissionsMatrix() {
  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Roles & Permissions</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          The CRM shell and backend follow the same delivery permissions for admin, PMO, manager, and member roles.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              <th className="pb-3 font-semibold text-white">Action</th>
              <th className="pb-3 font-semibold text-white">Admin</th>
              <th className="pb-3 font-semibold text-white">PMO</th>
              <th className="pb-3 font-semibold text-white">Manager</th>
              <th className="pb-3 font-semibold text-white">Member</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-slate-800 last:border-b-0">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${cell}`} className={`py-3 ${index === 0 ? "text-white" : "text-slate-300"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
