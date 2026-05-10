"use client";

export function ArchitectureDiagram() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">AAC Architecture</h3>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
        <div className="rounded border border-slate-200 bg-slate-50 p-3">Edge Agents: Control, Jitter, Confidence</div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">Mid Agent: Resolution Adaptation</div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">Cloud: Orchestration + Policy Deploy</div>
      </div>
    </div>
  );
}
