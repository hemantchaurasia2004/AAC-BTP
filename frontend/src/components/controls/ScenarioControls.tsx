"use client";

import { useTelemetryStore } from "@/store/useTelemetryStore";
import type { Scenario } from "@/types/telemetry";

const scenarios: Scenario[] = [
  "normal_operation",
  "high_performance_demand",
  "sensor_noise_attack",
  "sudden_disturbance",
  "unseen_state_region",
  "actuator_degradation",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function ScenarioControls() {
  const scenario = useTelemetryStore((s) => s.scenario);
  const setScenario = useTelemetryStore((s) => s.setScenario);

  async function onChange(next: Scenario) {
    setScenario(next);
    await fetch(`${API_URL}/control/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: next }),
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-medium text-slate-600">Demo Scenario</p>
      <select
        value={scenario}
        onChange={(e) => onChange(e.target.value as Scenario)}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
      >
        {scenarios.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
