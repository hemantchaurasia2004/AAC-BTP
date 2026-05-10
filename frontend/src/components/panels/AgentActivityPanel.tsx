"use client";

export function AgentActivityPanel({ logs = [] }: { logs: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Agent Activity</h3>
      <div className="space-y-2 text-xs">
        {logs.slice(-6).map((log, idx) => (
          <div key={`${log}-${idx}`} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
