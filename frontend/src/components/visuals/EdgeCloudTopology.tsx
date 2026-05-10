"use client";

export function EdgeCloudTopology({
  deploymentStatus,
  syncStatus,
}: {
  deploymentStatus?: string;
  syncStatus?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Edge-Cloud Topology</h3>
      <div className="flex items-center justify-between text-xs">
        <div className="rounded bg-blue-50 px-3 py-2 font-medium text-blue-700">EDGE NODE</div>
        <div className="text-slate-500">telemetry / policy flow {">"}</div>
        <div className="rounded bg-indigo-50 px-3 py-2 font-medium text-indigo-700">CLOUD ORCHESTRATOR</div>
      </div>
      <p className="mt-3 text-xs text-slate-600">Deploy: {deploymentStatus ?? "idle"} | Sync: {syncStatus ?? "in-sync"}</p>
    </div>
  );
}
