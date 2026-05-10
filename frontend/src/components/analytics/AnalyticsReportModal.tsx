"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Download, Printer, Shield, Sparkles, X } from "lucide-react";
import { useMemo, type MouseEvent, type ReactNode } from "react";
import type { CycleAnalyticsReport } from "@/lib/analytics/types";

function clampPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "n/a";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function pctImproveDisplay(baseline: number, aac: number, lowerBetter: boolean) {
  if (!Number.isFinite(baseline) || !Number.isFinite(aac) || baseline === 0) return null;
  const raw = lowerBetter ? ((baseline - aac) / baseline) * 100 : ((aac - baseline) / baseline) * 100;
  return raw;
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTelemetryJson(report: CycleAnalyticsReport) {
  downloadBlob(
    `aac-telemetry-${Date.now()}.json`,
    JSON.stringify(report.telemetrySnapshot, null, 2),
    "application/json",
  );
}

function exportAnalyticsJson(report: CycleAnalyticsReport) {
  const { telemetrySnapshot, ...rest } = report;
  downloadBlob(`aac-analytics-${Date.now()}.json`, JSON.stringify(rest, null, 2), "application/json");
}

function exportSnapshot(report: CycleAnalyticsReport) {
  downloadBlob(
    `aac-analytics-snapshot-${Date.now()}.json`,
    JSON.stringify(report, null, 2),
    "application/json",
  );
}

function exportChartsCsv(report: CycleAnalyticsReport) {
  const rows: string[] = [];
  rows.push("series,t,col1,col2,col3,col4,col5");
  for (const p of report.charts.tracking) {
    rows.push(`tracking,${p.t},${p.baselineErr},${p.aacErr},${p.setpoint},${p.outAac},${p.outBase}`);
  }
  for (const p of report.charts.wear) {
    rows.push(`wear,${p.t},${p.movAac},${p.movBase},,,`);
  }
  downloadBlob(`aac-charts-${Date.now()}.csv`, rows.join("\n"), "text/csv");
}

export function AnalyticsReportView({
  report,
  variant,
  onDismiss,
}: {
  report: CycleAnalyticsReport;
  variant: "modal" | "page";
  onDismiss?: () => void;
}) {
  const trackingBars = useMemo(
    () => [
      {
        name: "RMSE",
        baseline: report.tracking.baseline.rmse,
        aac: report.tracking.aac.rmse,
        pct: pctImproveDisplay(report.tracking.baseline.rmse, report.tracking.aac.rmse, true),
      },
      {
        name: "MAE",
        baseline: report.tracking.baseline.meanAbsError,
        aac: report.tracking.aac.meanAbsError,
        pct: pctImproveDisplay(report.tracking.baseline.meanAbsError, report.tracking.aac.meanAbsError, true),
      },
      {
        name: "Overshoot %",
        baseline: report.tracking.baseline.overshootPct,
        aac: report.tracking.aac.overshootPct,
        pct: pctImproveDisplay(report.tracking.baseline.overshootPct, report.tracking.aac.overshootPct, true),
      },
      {
        name: "Settling proxy",
        baseline: report.tracking.baseline.settlingProxy,
        aac: report.tracking.aac.settlingProxy,
        pct: pctImproveDisplay(report.tracking.baseline.settlingProxy, report.tracking.aac.settlingProxy, true),
      },
    ],
    [report],
  );

  const radarData = useMemo(() => {
    const rmseMax = Math.max(report.tracking.baseline.rmse, report.tracking.aac.rmse, 1e-9);
    const movMax = Math.max(report.wear.totalBaselineMovement, report.wear.totalValveMovement, 1e-9);
    const settleMax = Math.max(report.tracking.baseline.settlingProxy, report.tracking.aac.settlingProxy, 1e-9);
    const toHeadroom = (v: number, max: number) => clampScore(100 * (1 - v / max));
    return [
      {
        subject: "Tracking stability",
        baseline: report.tracking.baseline.stabilityScore,
        aac: report.tracking.aac.stabilityScore,
      },
      {
        subject: "RMSE headroom",
        baseline: toHeadroom(report.tracking.baseline.rmse, rmseMax),
        aac: toHeadroom(report.tracking.aac.rmse, rmseMax),
      },
      {
        subject: "Settling headroom",
        baseline: toHeadroom(report.tracking.baseline.settlingProxy, settleMax),
        aac: toHeadroom(report.tracking.aac.settlingProxy, settleMax),
      },
      {
        subject: "Travel efficiency",
        baseline: toHeadroom(report.wear.totalBaselineMovement, movMax),
        aac: toHeadroom(report.wear.totalValveMovement, movMax),
      },
      {
        subject: "Reward convergence",
        baseline: report.rl.baselineConvergenceStability,
        aac: report.rl.convergenceStability,
      },
    ];
  }, [report]);

  const resolutionBars = useMemo(
    () =>
      Object.entries(report.cmac.regionUtilization)
        .map(([level, share]) => ({ level: `L${level}`, share: share * 100 }))
        .sort((a, b) => a.level.localeCompare(b.level)),
    [report],
  );

  const shellClass =
    variant === "modal"
      ? "fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-10 backdrop-blur-md"
      : "min-h-screen bg-[#020617] px-3 py-10 text-slate-100";

  function backdropDismiss(e: MouseEvent<HTMLDivElement>) {
    if (variant !== "modal" || !onDismiss) return;
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  }

  return (
    <div className={shellClass} onMouseDown={backdropDismiss}>
      <motion.div
        layout
        id="aac-analytics-print"
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.35 }}
        className={`relative mx-auto w-full max-w-6xl rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-slate-950 via-slate-950 to-black p-5 shadow-[0_0_60px_-10px_rgba(34,211,238,0.45)] ring-1 ring-cyan-400/20 ${
          variant === "modal" ? "my-4" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Post-Cycle Adaptive Control Analysis
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              AAC Optimization &amp; Performance Intelligence Report
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Trigger:{" "}
              <span className="text-cyan-200/90">
                {report.meta.triggerReason.replaceAll("_", " ")}
              </span>{" "}
              · Frames {report.meta.frameCount} · Window {report.meta.durationSec.toFixed(2)}s · Dominant scenario{" "}
              <span className="text-slate-200">{report.meta.dominantScenario.replaceAll("_", " ")}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60"
            >
              <Printer className="h-3.5 w-3.5" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => exportAnalyticsJson(report)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60"
            >
              <Download className="h-3.5 w-3.5" />
              Analytics JSON
            </button>
            <button
              type="button"
              onClick={() => exportTelemetryJson(report)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60"
            >
              Telemetry JSON
            </button>
            <button
              type="button"
              onClick={() => exportChartsCsv(report)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60"
            >
              Chart data CSV
            </button>
            <button
              type="button"
              onClick={() => exportSnapshot(report)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60"
            >
              Full snapshot
            </button>
            {variant === "page" ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_18px_-2px_rgba(34,211,238,0.8)]"
              >
                Command center
              </Link>
            ) : null}
            {onDismiss ? (
              <button
                type="button"
                aria-label="Close analytics"
                onClick={onDismiss}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-200 hover:border-rose-400/70 hover:text-rose-100"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlowKpi
            title="Overall system health"
            value={report.executive.healthScore}
            suffix="/100"
            caption="Stability, efficiency, confidence, smoothness, and control quality composite."
            accent="from-emerald-400/40 via-cyan-400/30 to-sky-500/30"
          />
          <GlowKpi
            title="Optimization efficiency"
            value={report.executive.optimizationEfficiencyPct}
            suffix="%"
            caption="Aggregated improvement across error, oscillation, settling, and control effort vs baseline."
            accent="from-fuchsia-400/40 via-violet-500/30 to-cyan-400/30"
          />
          <GlowKpi
            title="Actuator preservation"
            value={report.executive.actuatorPreservationPct ?? 0}
            suffix="%"
            caption={
              report.executive.actuatorPreservationPct === null
                ? "Wear delta indeterminate for this micro-window."
                : "Cumulative |Δu| reduction vs fixed-gain baseline twin."
            }
            accent="from-amber-300/40 via-orange-400/30 to-rose-500/30"
            softValue={report.executive.actuatorPreservationPct === null}
          />
          <GlowKpi
            title="Adaptive intelligence"
            value={report.executive.adaptiveIntelligencePct}
            suffix="%"
            caption="Context efficiency, gain responsiveness, and confidence-weighted policy stability."
            accent="from-sky-400/40 via-indigo-500/35 to-cyan-300/30"
          />
        </section>

        <Section
          kicker="Section 02"
          title="Tracking performance — baseline vs AAC"
          icon={<Sparkles className="h-4 w-4 text-cyan-300" />}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Metric comparison (lower is better for error family)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trackingBars} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 6" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="baseline" fill="#60a5fa" name="Baseline" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aac" fill="#22d3ee" name="AAC" radius={[4, 4, 0, 0]}>
                    {trackingBars.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.pct !== null && entry.pct >= 0
                            ? "#22c55e"
                            : entry.pct !== null && entry.pct < 0
                              ? "#f97316"
                              : "#22d3ee"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <dl className="mt-3 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
                <div className="flex justify-between rounded-md bg-slate-900/70 px-2 py-1">
                  <dt>RMSE uplift</dt>
                  <dd className="font-semibold text-slate-100">{clampPct(trackingBars[0].pct)}</dd>
                </div>
                <div className="flex justify-between rounded-md bg-slate-900/70 px-2 py-1">
                  <dt>Settling proxy uplift</dt>
                  <dd className="font-semibold text-slate-100">{clampPct(trackingBars[3].pct)}</dd>
                </div>
              </dl>
            </ChartCard>

            <ChartCard title="Abs. tracking error envelope">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={report.charts.tracking}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="4 6" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Line type="monotone" dataKey="baselineErr" stroke="#60a5fa" dot={false} name="Baseline |e|" />
                  <Line type="monotone" dataKey="aacErr" stroke="#22c55e" dot={false} name="AAC |e|" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[12px] text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Measured metrics</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricBlock label="RMSE" baseline={report.tracking.baseline.rmse} aac={report.tracking.aac.rmse} />
              <MetricBlock label="MAE" baseline={report.tracking.baseline.meanAbsError} aac={report.tracking.aac.meanAbsError} />
              <MetricBlock
                label="Overshoot %"
                baseline={report.tracking.baseline.overshootPct}
                aac={report.tracking.aac.overshootPct}
              />
              <MetricBlock label="Stability score" baseline={report.tracking.baseline.stabilityScore} aac={report.tracking.aac.stabilityScore} lowerBetter={false} />
            </div>
          </div>
        </Section>

        <Section
          kicker="Section 03"
          title="Actuator wear & jitter suppression"
          icon={<Shield className="h-4 w-4 text-amber-200" />}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Incremental control movement timeline">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={report.charts.wear}>
                  <defs>
                    <linearGradient id="wearAac" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="wearBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Area type="monotone" dataKey="movBase" stroke="#60a5fa" fill="url(#wearBase)" name="Baseline |Δu|" />
                  <Area type="monotone" dataKey="movAac" stroke="#22d3ee" fill="url(#wearAac)" name="AAC |Δu|" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Oscillation reduction (output second-difference proxy)">
              <OscillationReduction report={report} />
            </ChartCard>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 text-sm text-slate-200">
            <Stat label="Total Σ|Δu| (AAC)" value={report.wear.totalValveMovement.toFixed(3)} hint="Twin-plant actuator travel." />
            <Stat
              label="Total Σ|Δu| (Baseline)"
              value={report.wear.totalBaselineMovement.toFixed(3)}
              hint="Parallel non-adaptive controller effort."
            />
            <Stat
              label="Wear reduction"
              value={report.wear.wearReductionPct === null ? "n/a" : clampPct(report.wear.wearReductionPct)}
              hint="Versus baseline controller command increments."
            />
            <Stat
              label="Jitter suppression"
              value={report.wear.jitterSuppressionPct === null ? "n/a" : clampPct(report.wear.jitterSuppressionPct)}
              hint="Variance of |Δu| vs baseline."
            />
            <Stat
              label="Deadband efficiency score"
              value={`${report.wear.deadbandEfficiencyScore.toFixed(1)} /100`}
              hint="Freeze utilization + jitter delta composite."
            />
          </div>
        </Section>

        <Section kicker="Section 04" title="PID adaptation intelligence">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Kp / Ki / Kd evolution">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={report.charts.gains}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Line type="monotone" dataKey="kp" stroke="#38bdf8" dot={false} name="Kp" />
                  <Line type="monotone" dataKey="ki" stroke="#a78bfa" dot={false} name="Ki" />
                  <Line type="monotone" dataKey="kd" stroke="#fbbf24" dot={false} name="Kd" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gain diagnostics</p>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
                <li>Gain variance (stability of adaptation): {report.pid.gainVariance.toFixed(5)}</li>
                <li>Gain smoothness score: {report.pid.gainSmoothnessScore.toFixed(1)} / 100</li>
                <li>Adaptation responsiveness: {report.pid.adaptationResponsiveness.toFixed(1)} / 100</li>
                <li>Context-aware switching efficiency: {report.pid.contextSwitchEfficiencyPct.toFixed(1)} / 100</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section kicker="Section 05" title="RL / policy optimization">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Reward vs baseline reward proxy">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={report.charts.rewards}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Line type="monotone" dataKey="rewardBaseProxy" stroke="#60a5fa" dot={false} name="Baseline proxy" />
                  <Line type="monotone" dataKey="reward" stroke="#c084fc" strokeWidth={2} dot={false} name="AAC reward" />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-2 text-[11px] text-slate-400">
                Baseline proxy mirrors the streamed reward machinery using baseline tracking error &amp; controls (no AAC-only terms).
              </p>
            </ChartCard>

            <ChartCard title="Optimization radar">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                  <Radar name="Baseline profile" dataKey="baseline" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.16} />
                  <Radar name="AAC adaptive" dataKey="aac" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                </RadarChart>
              </ResponsiveContainer>
              <dl className="mt-2 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
                <div className="flex justify-between rounded-md bg-slate-900/70 px-2 py-1">
                  <dt>Avg reward</dt>
                  <dd className="text-slate-100">{report.rl.avgReward.toFixed(4)}</dd>
                </div>
                <div className="flex justify-between rounded-md bg-slate-900/70 px-2 py-1">
                  <dt>Reward lift</dt>
                  <dd className="text-slate-100">{clampPct(report.rl.rewardImprovementPct)}</dd>
                </div>
              </dl>
            </ChartCard>
          </div>
        </Section>

        <Section kicker="Section 06" title="Uncertainty, safety & recovery">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Confidence & fallback occupancy">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={report.charts.confidence}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Line type="monotone" dataKey="confidence" stroke="#22c55e" dot={false} name="Confidence" strokeWidth={2} />
                  <Line type="monotone" dataKey="fallback" stroke="#f97316" dot={false} name="Fallback level" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-[13px] text-slate-200">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Safety telemetry</p>
              <ul className="mt-3 space-y-2">
                <li>Average confidence: {(report.uncertainty.avgConfidence * 100).toFixed(2)}%</li>
                <li>Unsafe / low-confidence frames: {report.uncertainty.unsafeDetections}</li>
                <li>Fallback frames: {report.uncertainty.fallbackTriggerFrames}</li>
                <li>
                  Recovery success rate:{" "}
                  {report.uncertainty.recoverySuccessRate === null
                    ? "n/a"
                    : `${report.uncertainty.recoverySuccessRate.toFixed(1)}%`}
                </li>
                <li>Disturbance stability score: {report.uncertainty.disturbanceStabilityScore.toFixed(1)} / 100</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section kicker="Section 07" title="Control latency & edge feasibility">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Latency trace & budget">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={report.charts.latency}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Line type="monotone" dataKey="latency" stroke="#fb923c" dot={false} name="Latency (ms)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid gap-3 sm:grid-cols-2">
              <GaugeCard label="Real-time stability" value={report.latency.realtimeStabilityPct} hint="% samples under adaptive budget (1.15× tick)." />
              <GaugeCard label="Edge efficiency" value={report.latency.edgeEfficiencyScore} hint="Inverse latency dispersion vs mean." />
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 sm:col-span-2">
                <p>
                  Average latency {report.latency.avgLatencyMs.toFixed(3)} ms · Peak {report.latency.peakLatencyMs.toFixed(3)} ms · Tick median{" "}
                  {report.meta.tickMsMedian.toFixed(0)} ms
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section kicker="Section 08" title="Multi-resolution CMAC utilization">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Resolution level occupancy">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={resolutionBars}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
                  <XAxis dataKey="level" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                  <Bar dataKey="share" fill="#38bdf8" radius={[6, 6, 0, 0]} name="% window" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-[13px] text-slate-200">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CMAC analytics</p>
              <ul className="mt-3 space-y-2">
                <li>High-activity temporal regions (75th pct. output delta): {report.cmac.highActivityRegions}</li>
                <li>Sparse-state detection (% low resolution bands): {report.cmac.sparseStatePct.toFixed(1)}%</li>
                <li>Adaptive resolution efficiency score: {report.cmac.adaptiveResolutionEfficiency.toFixed(1)} / 100</li>
              </ul>
              <div className="mt-4 rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-3">
                <p className="text-[11px] text-slate-400">Refinement density heat-strip (resolution vs time)</p>
                <ResponsiveContainer width="100%" height={152} className="min-w-0">
                  <ComposedChart data={report.charts.resolution}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="t" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <YAxis domain={[0, "auto"]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
                    <Area type="stepAfter" dataKey="resolution" stroke="#22d3ee" fill="#22d3ee55" name="resolution" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Section>

        <Section
          kicker="Section 09"
          title="Narrative intelligence summary"
          icon={<Sparkles className="h-4 w-4 text-fuchsia-300" />}
        >
          <div className="rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 via-slate-950 to-slate-950 p-5 text-sm leading-relaxed text-slate-100 shadow-[inset_0_0_40px_rgba(217,70,239,0.12)]">
            {report.narrative.split(" ").reduce<string[]>((acc, word, idx) => {
              const chunkIdx = Math.floor(idx / 32);
              if (!acc[chunkIdx]) acc[chunkIdx] = "";
              acc[chunkIdx] += `${word} `;
              return acc;
            }, []).map((p, i) => (
              <p key={`n-${i}`} className="mb-3 last:mb-0">
                {p.trim()}
              </p>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 shadow-[0_0_48px_-10px_rgba(34,211,238,.45)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-[0.18em] text-cyan-200/85">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Score /100</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                <ScoreRow title="Stability" value={report.scorecard.stability} />
                <ScoreRow title="Adaptability" value={report.scorecard.adaptability} />
                <ScoreRow title="Efficiency" value={report.scorecard.efficiency} />
                <ScoreRow title="Safety" value={report.scorecard.safety} />
                <ScoreRow title="Smoothness" value={report.scorecard.smoothness} />
                <ScoreRow title="Intelligence" value={report.scorecard.intelligence} />
              </tbody>
            </table>
            <div className="flex flex-col gap-2 border-t border-slate-800 px-4 py-4 text-sm text-slate-100 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/70">AAC research performance index</p>
                <p className="text-3xl font-semibold text-white">
                  {report.finalAacScore.toFixed(1)} /100
                </p>
              </div>
              <p className="max-w-xl text-[12px] text-slate-400">
                Derived as the arithmetic mean of the six category pillars—each bounded 0–100 from the live telemetry window. No Monte-Carlo fillers;
                inspect JSON exports for full provenance.
              </p>
            </div>
          </div>
        </Section>
      </motion.div>
    </div>
  );
}

function OscillationReduction({ report }: { report: CycleAnalyticsReport }) {
  const series = useMemo(() => {
    const t = report.charts.tracking;
    return t.map((row, idx) => {
      if (idx < 2) return { t: row.t, base: 0, aac: 0 };
      const prev2 = report.charts.tracking[idx - 2]!;
      const prev1 = report.charts.tracking[idx - 1]!;
      const base = prev2.outBase - 2 * prev1.outBase + row.outBase;
      const aac = prev2.outAac - 2 * prev1.outAac + row.outAac;
      return { t: row.t, base: Math.abs(base), aac: Math.abs(aac) };
    });
  }, [report]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={series}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" />
        <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
        <Line type="monotone" dataKey="base" stroke="#f97316" dot={false} name="Baseline |Δ²y|" />
        <Line type="monotone" dataKey="aac" stroke="#22c55e" dot={false} name="AAC |Δ²y|" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ScoreRow({ title, value }: { title: string; value: number }) {
  return (
    <tr className="border-t border-slate-800/80 odd:bg-slate-950/60 even:bg-slate-900/40">
      <td className="px-4 py-3 font-medium text-slate-200">{title}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 shadow-[0_0_12px_rgba(34,211,238,0.75)]"
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm font-semibold text-white">{value.toFixed(0)}</span>
        </div>
      </td>
    </tr>
  );
}

function MetricBlock({
  label,
  baseline,
  aac,
  lowerBetter = true,
}: {
  label: string;
  baseline: number;
  aac: number;
  lowerBetter?: boolean;
}) {
  const pct = pctImproveDisplay(baseline, aac, lowerBetter);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-xs text-slate-400">Baseline {baseline.toFixed(4)}</p>
      <p className="text-sm font-semibold text-slate-50">AAC {aac.toFixed(4)}</p>
      <p className={`text-[11px] ${pct !== null && pct >= 0 ? "text-emerald-300" : "text-orange-300"}`}>
        {pct === null ? "Δ n/a" : `${pct >= 0 ? "▲ " : "▼ "}${Math.abs(pct).toFixed(1)}% ${lowerBetter ? "lower is better" : "higher is better"}`}
      </p>
    </div>
  );
}

function GaugeCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value.toFixed(1)}%</p>
      <p className="mt-2 text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}

function Section({
  kicker,
  title,
  children,
  icon,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="mt-8 border-t border-slate-800/80 pt-6"
    >
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">{kicker}</p>
        <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 shadow-[inset_0_0_24px_rgba(15,23,42,0.65)]">
      <p className="mb-2 text-[12px] font-semibold text-slate-200">{title}</p>
      <div className="min-h-[260px] w-full min-w-0">{children}</div>
    </div>
  );
}

function GlowKpi({
  title,
  value,
  suffix,
  caption,
  accent,
  softValue,
}: {
  title: string;
  value: number;
  suffix: string;
  caption: string;
  accent: string;
  softValue?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_0_40px_-12px_rgba(34,211,238,0.45)]`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-40 blur-3xl`} />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
        <div className="mt-3 text-4xl font-semibold text-white">
          {softValue ? (
            <span className="text-slate-200">n/a</span>
          ) : (
            <span>
              {value.toFixed(value > 30 && suffix === "%" ? 0 : 1)}
              {suffix}
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{caption}</p>
      </div>
    </div>
  );
}
