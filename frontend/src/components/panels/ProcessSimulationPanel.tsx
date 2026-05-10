"use client";

import { motion } from "framer-motion";
import type { TelemetryFrame } from "@/types/telemetry";

export function ProcessSimulationPanel({ latest }: { latest?: TelemetryFrame }) {
  const tank = Math.round((latest?.tank_level ?? 0.2) * 100);
  const valve = Math.round((latest?.valve_position ?? 0.2) * 100);
  const pressure = Math.round((latest?.pressure ?? 0.2) * 100);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Live Process Simulation</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">Tank Level</p>
          <div className="mt-2 h-32 rounded-md bg-slate-100 p-2">
            <motion.div
              className="h-full rounded bg-blue-500/70"
              animate={{ height: `${tank}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-600">{tank}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">Valve</p>
          <motion.div
            className="mt-4 h-4 rounded-full bg-emerald-500"
            animate={{ width: `${Math.max(8, valve)}%` }}
            transition={{ duration: 0.25 }}
          />
          <p className="mt-4 text-xs text-slate-600">{valve}% opening</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">Pressure</p>
          <p className="mt-5 text-3xl font-bold text-indigo-700">{pressure}</p>
          <p className="text-xs text-slate-600">kPa (scaled)</p>
        </div>
      </div>
    </div>
  );
}
