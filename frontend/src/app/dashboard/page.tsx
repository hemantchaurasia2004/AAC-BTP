"use client";

import { useMemo } from "react";
import { useTelemetrySocket } from "@/hooks/useTelemetrySocket";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { LiveLineChart } from "@/components/charts/LiveLineChart";
import { ResolutionHeatmap } from "@/components/charts/ResolutionHeatmap";
import { ProcessSimulationPanel } from "@/components/panels/ProcessSimulationPanel";
import { AgentActivityPanel } from "@/components/panels/AgentActivityPanel";
import { MetricsPanel } from "@/components/panels/MetricsPanel";
import { ScenarioControls } from "@/components/controls/ScenarioControls";
import { ReplayControls } from "@/components/controls/ReplayControls";
import { EdgeCloudTopology } from "@/components/visuals/EdgeCloudTopology";
import { CycleAnalyticsToolbar } from "@/components/analytics/CycleAnalyticsToolbar";
import Link from "next/link";

export default function DashboardPage() {
  useTelemetrySocket();
  const latest = useTelemetryStore((s) => s.latest);
  const frames = useTelemetryStore((s) => s.frames);
  const connected = useTelemetryStore((s) => s.connected);

  const chartData = useMemo(
    () =>
      frames.map((f) => ({
        t: f.ts.toFixed(1),
        setpoint: f.setpoint,
        output_aac: f.output_aac,
        output_baseline: f.output_baseline,
        kp: f.kp,
        ki: f.ki,
        kd: f.kd,
        jitter: f.jitter_metric,
        confidence: f.confidence,
        reward: f.reward,
        latency: f.latency_ms,
        control: f.control_aac,
      })),
    [frames],
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Agentic Adaptive Control Command Center</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/analytics-report"
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:text-cyan-700"
            >
              Analytics route
            </Link>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {connected ? "LIVE CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <ScenarioControls />
          <ReplayControls />
          <CycleAnalyticsToolbar />
          <EdgeCloudTopology deploymentStatus={latest?.deployment_status} syncStatus={latest?.policy_sync_status} />
        </div>

        <ProcessSimulationPanel latest={latest} />
        <MetricsPanel latest={latest} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <LiveLineChart
            title="System Output vs Setpoint"
            data={chartData}
            series={[
              { key: "output_baseline", color: "#60a5fa", name: "Baseline" },
              { key: "output_aac", color: "#b91c1c", name: "AAC" },
              { key: "setpoint", color: "#6b7280", name: "Setpoint", dashed: true },
            ]}
          />
          <LiveLineChart
            title="PID Gain Adaptation"
            data={chartData}
            series={[
              { key: "kp", color: "#1d4ed8", name: "Kp" },
              { key: "ki", color: "#047857", name: "Ki" },
              { key: "kd", color: "#b45309", name: "Kd" },
            ]}
          />
          <LiveLineChart title="Jitter Visualization" data={chartData} series={[{ key: "jitter", color: "#dc2626", name: "Noise/Jitter" }]} />
          <LiveLineChart title="UQ / Confidence" data={chartData} series={[{ key: "confidence", color: "#2563eb", name: "Confidence" }]} />
          <LiveLineChart title="RL Reward" data={chartData} series={[{ key: "reward", color: "#7c3aed", name: "Reward" }]} />
          <LiveLineChart title="Control Latency" data={chartData} series={[{ key: "latency", color: "#ea580c", name: "Latency (ms)" }]} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <LiveLineChart title="Context Switching Timeline" data={chartData} series={[{ key: "control", color: "#0891b2", name: "Control Signal Proxy" }]} />
          <ResolutionHeatmap level={latest?.resolution_level ?? 4} />
          <AgentActivityPanel logs={latest?.agent_logs ?? []} />
        </div>
      </div>
    </main>
  );
}
