"use client";

import type { TelemetryFrame } from "@/types/telemetry";

const fmt = (v: number | undefined) => (v ?? 0).toFixed(3);

export function MetricsPanel({ latest }: { latest?: TelemetryFrame }) {
  const cards = [
    ["Tracking Error", fmt(latest?.tracking_error)],
    ["Overshoot", fmt(latest?.overshoot)],
    ["Settling Proxy", fmt(latest?.settling_time_proxy)],
    ["Control Energy", fmt(latest?.control_energy)],
    ["Actuator Wear", fmt(latest?.actuator_wear_index)],
    ["Confidence", fmt(latest?.confidence)],
    ["RL Reward", fmt(latest?.reward)],
    ["System Health", fmt(latest?.system_health)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">{k}</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{v}</p>
        </div>
      ))}
    </div>
  );
}
