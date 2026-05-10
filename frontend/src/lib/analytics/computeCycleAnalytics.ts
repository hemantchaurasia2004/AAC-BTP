import type { Scenario, TelemetryFrame } from "@/types/telemetry";
import type { CycleAnalyticsReport as Report, TrackingMetrics } from "./types";

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
}

function std(values: number[]): number {
  return Math.sqrt(variance(values));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function safeDiv(num: number, den: number): number {
  if (den === 0 || !Number.isFinite(den)) return 0;
  return num / den;
}

function pctImprovement(baseline: number, aac: number, lowerIsBetter: boolean): number | null {
  if (!Number.isFinite(baseline) || !Number.isFinite(aac)) return null;
  const eps = 1e-9;
  if (lowerIsBetter) {
    if (baseline <= eps) return null;
    return ((baseline - aac) / baseline) * 100;
  }
  if (baseline <= eps) return null;
  return ((aac - baseline) / baseline) * 100;
}

function rmse(errors: number[]): number {
  if (!errors.length) return 0;
  return Math.sqrt(mean(errors.map((e) => e * e)));
}

function totalMovement(signal: number[]): number {
  let s = 0;
  for (let i = 1; i < signal.length; i++) {
    s += Math.abs(signal[i] - signal[i - 1]);
  }
  return s;
}

function oscIntensity(series: number[]): number {
  if (series.length < 3) return 0;
  const d2: number[] = [];
  for (let i = 2; i < series.length; i++) {
    d2.push(series[i] - 2 * series[i - 1] + series[i - 2]);
  }
  return std(d2);
}

function computeTrackingMetrics(
  setpoints: number[],
  outputs: number[],
  overshootStream: number[],
  settlingStream: number[],
): TrackingMetrics {
  const errs = setpoints.map((sp, i) => sp - outputs[i]);
  const rm = rmse(errs);
  const mae = mean(errs.map(Math.abs));
  const span = Math.max(1e-6, ...setpoints.map((s) => Math.abs(s)));
  const os = overshootStream.length ? Math.max(...overshootStream) : 0;
  const overshootPct = clamp((os / span) * 100, 0, 200);
  const settlingProxy = settlingStream.length ? mean(settlingStream) : mae;
  let riseProxy = 0;
  if (errs.length > 2) {
    const target = setpoints[0];
    const y0 = outputs[0];
    const band = Math.max(0.02, Math.abs(target - y0) * 0.1);
    const goal = y0 + Math.sign(target - y0) * Math.abs(target - y0) * 0.9;
    const idx = outputs.findIndex((y, i) => i > 0 && Math.abs(y - goal) <= band);
    riseProxy = idx >= 0 ? idx : outputs.length;
  }
  const osc = oscIntensity(outputs);
  const stabilityScore = clamp(100 / (1 + 12 * osc), 0, 100);
  return {
    rmse: rm,
    meanAbsError: mae,
    overshootPct,
    settlingProxy,
    riseProxy,
    stabilityScore,
  };
}

function dominantScenario(frames: TelemetryFrame[]): Scenario {
  const counts = new Map<string, number>();
  for (const f of frames) {
    counts.set(f.scenario, (counts.get(f.scenario) ?? 0) + 1);
  }
  let best: Scenario = frames[0]?.scenario ?? "normal_operation";
  let bestC = 0;
  for (const [k, v] of counts) {
    if (v > bestC) {
      bestC = v;
      best = k as Scenario;
    }
  }
  return best;
}

function rewardProxy(err: number, u: number, conf: number, freeze: boolean): number {
  const e2 = err * err;
  const effort = Math.abs(u);
  const penalty = freeze ? 0.05 : 0;
  return -(0.55 * e2 + 0.25 * effort + 0.2 * (1 - conf)) - penalty;
}

function buildNarrative(r: Omit<Report, "narrative" | "telemetrySnapshot">, frames: TelemetryFrame[]): string {
  const te = pctImprovement(r.tracking.baseline.rmse, r.tracking.aac.rmse, true);
  const wear = r.wear.wearReductionPct;
  const smooth = r.pid.gainSmoothnessScore;
  const oscB = oscIntensity(frames.map((f) => f.output_baseline));
  const oscA = oscIntensity(frames.map((f) => f.output_aac));
  const oscImp = pctImprovement(oscB, oscA, true);
  const confPct = r.uncertainty.avgConfidence * 100;

  const lines: string[] = [];
  lines.push(
    "The AAC framework operated under the recorded telemetry window with adaptive policies, uncertainty-aware fallbacks, and edge-side inference characteristics captured in this cycle.",
  );
  lines.push(`Compared to the fixed-gain baseline twin plant, key computed deltas include:`);
  if (te !== null) {
    const dir = te >= 0 ? "lower" : "higher";
    lines.push(
      `• RMSE ${Math.abs(te).toFixed(1)}% ${dir} than baseline${te >= 0 ? " (AAC advantage)" : " (baseline led this window)"}`,
    );
  }
  if (wear !== null) {
    lines.push(`• ${Math.abs(wear).toFixed(1)}% ${wear >= 0 ? "less" : "more"} cumulative control movement vs baseline${wear >= 0 ? " (actuator preservation)" : ""}`);
  }
  lines.push(`• Gain smoothness index ${smooth.toFixed(1)} / 100 (higher implies fewer abrupt gain stair-steps).`);
  if (oscImp !== null) {
    lines.push(`• Oscillation intensity ${oscImp >= 0 ? "reduced" : "increased"} by ${Math.abs(oscImp).toFixed(1)}% vs baseline (second-difference dispersion of plant output).`);
  }
  lines.push(`• Mean operational confidence ${confPct.toFixed(1)}% with ${r.uncertainty.fallbackTriggerFrames} frames in elevated fallback.`);
  lines.push(
    r.executive.optimizationEfficiencyPct >= 0
      ? "Net optimization efficiency for this window is positive when aggregating error, oscillation, control effort, and settling proxies."
      : "Net optimization efficiency for this window was negative—review scenario stress, baseline tuning, or disturbance timing.",
  );
  lines.push(
    `Edge latency averaged ${r.latency.avgLatencyMs.toFixed(2)} ms (peak ${r.latency.peakLatencyMs.toFixed(2)} ms), with ${r.latency.realtimeStabilityPct.toFixed(1)}% of samples under the adaptive real-time budget.`,
  );
  return lines.join(" ");
}

export function computeCycleAnalytics(
  frames: TelemetryFrame[],
  triggerReason: Report["meta"]["triggerReason"] = "time_cycle",
): Report {
  const sorted = [...frames].sort((a, b) => a.ts - b.ts);
  const frameCount = sorted.length;
  const durationSec = frameCount >= 2 ? sorted[sorted.length - 1].ts - sorted[0].ts : 0;
  const tickMsMedian = median(sorted.map((f) => f.dt_ms));

  const setpoints = sorted.map((f) => f.setpoint);
  const outA = sorted.map((f) => f.output_aac);
  const outB = sorted.map((f) => f.output_baseline);
  const uA = sorted.map((f) => f.control_aac);
  const uB = sorted.map((f) => f.control_baseline);

  const errA = setpoints.map((sp, i) => sp - outA[i]);
  const errB = setpoints.map((sp, i) => sp - outB[i]);

  const overshootA = sorted.map((f) => f.overshoot);
  const overshootB = sorted.map((f, i) => Math.max(0, outB[i] - setpoints[i]));
  const settling = sorted.map((f) => f.settling_time_proxy);

  const aacTrack = computeTrackingMetrics(setpoints, outA, overshootA, settling);
  const baseTrack = computeTrackingMetrics(setpoints, outB, overshootB, settling.map((_, i) => sorted[i].settling_time_proxy));

  const movementAac = totalMovement(uA);
  const movementBase = totalMovement(uB);
  const wearReductionPct = pctImprovement(movementBase + 1e-9, movementAac + 1e-9, true);

  const dA = uA.slice(1).map((_, i) => Math.abs(uA[i + 1] - uA[i]));
  const dB = uB.slice(1).map((_, i) => Math.abs(uB[i + 1] - uB[i]));
  const varA = variance(dA);
  const varB = variance(dB);
  const jitterSuppressionPct = pctImprovement(varB + 1e-12, varA + 1e-12, true);

  const freezeFrac = mean(sorted.map((f) => (f.jitter_freeze_active ? 1 : 0)));
  const deadbandEfficiencyScore = clamp(100 * (0.45 * freezeFrac + 0.55 * (jitterSuppressionPct !== null ? clamp(jitterSuppressionPct / 100, 0, 1) : 0)), 0, 100);

  const kp = sorted.map((f) => f.kp);
  const ki = sorted.map((f) => f.ki);
  const kd = sorted.map((f) => f.kd);
  const gainVariance = variance(kp) + variance(ki) + variance(kd);
  const dKp = kp.slice(1).map((_, i) => Math.abs(kp[i + 1] - kp[i]));
  const d2Kp = kp.slice(2).map((_, i) => Math.abs(kp[i + 2] - 2 * kp[i + 1] + kp[i]));
  const gainSmoothnessScore = clamp(100 / (1 + 18 * mean(dKp) + 40 * mean(d2Kp)), 0, 100);
  const oscillationIntensityIndex = mean(sorted.map((f) => f.oscillation_intensity_index));
  const adaptationEfficiency = mean(sorted.map((f) => f.adaptation_efficiency));
  const stabilityRecoveryTime = mean(sorted.map((f) => f.stability_recovery_time));

  const errDelta = errA.slice(1).map((_, i) => Math.abs(errA[i + 1] - errA[i]));
  const resp = corr(errDelta, dKp);
  const adaptationResponsiveness = clamp(50 + 50 * resp, 0, 100);

  const modes = sorted.map((f) => f.mode);
  let switches = 0;
  for (let i = 1; i < modes.length; i++) {
    if (modes[i] !== modes[i - 1]) switches++;
  }
  const switchRate = safeDiv(switches, Math.max(durationSec, 1e-6));
  const ctxEff = clamp(100 - 18 * switchRate * (1 - mean(sorted.map((f) => f.confidence))), 0, 100);

  const rewards = sorted.map((f) => f.reward);
  const rewardsBase = sorted.map((f, i) =>
    rewardProxy(errB[i], uB[i], f.confidence, false),
  );
  const avgReward = mean(rewards);
  const baselineRewardProxy = mean(rewardsBase);
  const rewardImprovementPct = pctImprovement(-baselineRewardProxy, -avgReward, true);

  const rewardSeg = rewards.slice(Math.floor(rewards.length * 0.5));
  const rewardSeg0 = rewards.slice(0, Math.floor(rewards.length * 0.5));
  const rewardsBaseSeg = rewardsBase.slice(Math.floor(rewardsBase.length * 0.5));
  const rewardsBaseSeg0 = rewardsBase.slice(0, Math.floor(rewardsBase.length * 0.5));
  const conv = clamp(100 * (1 - safeDiv(std(rewardSeg), std(rewardSeg0) + 1e-9)), 0, 100);
  const baselineConvergenceStability = clamp(
    100 * (1 - safeDiv(std(rewardsBaseSeg), std(rewardsBaseSeg0) + 1e-9)),
    0,
    100,
  );
  const explorationVsStability = clamp(100 - 40 * switchRate, 0, 100);
  const policyConfidenceScore = clamp(100 * mean(sorted.map((f) => f.confidence)) * (1 - 0.35 * safeDiv(switches, frameCount)), 0, 100);

  const avgConf = mean(sorted.map((f) => f.confidence));
  const unsafe = sorted.filter((f) => f.confidence < 0.35 || f.fallback_level > 0).length;
  const fallbackFrames = sorted.filter((f) => f.fallback_level > 0).length;
  let recoveries = 0;
  let attempts = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].fallback_level > 0 && sorted[i].fallback_level === 0) {
      attempts++;
      if (sorted[i].confidence >= 0.45) recoveries++;
    }
  }
  const recoverySuccessRate = attempts ? (recoveries / attempts) * 100 : null;
  const postDist = sorted.filter((f) => Math.abs(f.tracking_error) > 0.08);
  const disturbanceStabilityScore = clamp(100 - 40 * mean(postDist.map((f) => f.tracking_error)), 0, 100);

  const latencies = sorted.map((f) => f.latency_ms);
  const avgLat = mean(latencies);
  const peakLat = latencies.length ? Math.max(...latencies) : 0;
  const budget = Math.max(sorted[0]?.dt_ms ?? 200, 50) * 1.15;
  const realtimeStabilityPct = mean(latencies.map((l) => (l <= budget ? 1 : 0))) * 100;
  const edgeEfficiencyScore = clamp(100 / (1 + safeDiv(std(latencies), avgLat + 1e-9)), 0, 100);

  const resLevels = sorted.map((f) => f.resolution_level);
  const util: Record<number, number> = {};
  for (const r of resLevels) {
    util[r] = (util[r] ?? 0) + 1;
  }
  for (const k of Object.keys(util)) {
    util[Number(k)] = util[Number(k)]! / frameCount;
  }
  const outDelta = outA.slice(1).map((_, i) => Math.abs(outA[i + 1] - outA[i]));
  const actThreshold = percentile(outDelta, 0.75);
  let highAct = 0;
  for (let i = 1; i < outA.length; i++) {
    if (Math.abs(outA[i] - outA[i - 1]) >= actThreshold) highAct++;
  }
  const sparseStatePct = mean(resLevels.map((r) => (r <= 2 ? 1 : 0))) * 100;
  const adaptiveResolutionEfficiency = clamp(70 + 15 * (1 - std(resLevels.map(Number)) / 3) + 5 * (1 - sparseStatePct / 100), 0, 100);

  const oscA = oscIntensity(outA);
  const oscB = oscIntensity(outB);

  const optMix =
    0.32 * safePct01(pctImprovement(baseTrack.rmse, aacTrack.rmse, true)) +
    0.24 * safePct01(pctImprovement(oscB, oscA, true)) +
    0.18 * safePct01(pctImprovement(baseTrack.settlingProxy, aacTrack.settlingProxy, true)) +
    0.26 * safePct01(pctImprovement(mean(dB) + 1e-9, mean(dA) + 1e-9, true));
  const optimizationEfficiencyPct = optMix * 100;

  const stabilityComp = mean([aacTrack.stabilityScore, conv * 0.8, disturbanceStabilityScore * 0.9]);
  const efficiencyComp = clamp(0.45 * (realtimeStabilityPct + edgeEfficiencyScore) / 2 + 0.55 * (wearReductionPct !== null ? clamp(50 + wearReductionPct / 2, 0, 100) : 70), 0, 100);
  const smoothnessComp = mean([gainSmoothnessScore, deadbandEfficiencyScore, explorationVsStability]);
  const confidenceComp = mean([policyConfidenceScore, avgConf * 100, recoverySuccessRate ?? avgConf * 100]);
  const healthScore = clamp(
    0.22 * stabilityComp +
      0.22 * efficiencyComp +
      0.18 * smoothnessComp +
      0.22 * confidenceComp +
      0.16 * clamp(50 + optimizationEfficiencyPct / 2, 0, 100),
    0,
    100,
  );

  const adaptiveIntelligencePct = clamp(
    0.34 * policyConfidenceScore + 0.33 * ctxEff + 0.33 * adaptationResponsiveness,
    0,
    100,
  );

  const scorecard = {
    stability: clamp(stabilityComp, 0, 100),
    adaptability: clamp(0.55 * adaptationResponsiveness + 0.45 * ctxEff, 0, 100),
    efficiency: clamp(efficiencyComp, 0, 100),
    safety: clamp(0.5 * (recoverySuccessRate ?? avgConf * 100) + 0.5 * (100 - clamp((unsafe / frameCount) * 100, 0, 100)), 0, 100),
    smoothness: clamp(smoothnessComp, 0, 100),
    intelligence: clamp(adaptiveIntelligencePct, 0, 100),
  };

  const finalAacScore = mean(Object.values(scorecard));

  const meta = {
    generatedAtIso: new Date().toISOString(),
    frameCount,
    durationSec,
    dominantScenario: dominantScenario(sorted),
    tickMsMedian,
    triggerReason,
  };

  const executive = {
    healthScore,
    optimizationEfficiencyPct,
    actuatorPreservationPct: wearReductionPct,
    adaptiveIntelligencePct,
  };

  const downsample = Math.max(1, Math.floor(sorted.length / 180));
  const wearFull = sorted.map((f, i) => ({
    t: f.ts.toFixed(2),
    movAac: i > 0 ? Math.abs(f.control_aac - sorted[i - 1]!.control_aac) : 0,
    movBase: i > 0 ? Math.abs(f.control_baseline - sorted[i - 1]!.control_baseline) : 0,
  }));
  const charts = {
    tracking: sorted
      .filter((_, i) => i % downsample === 0)
      .map((f) => ({
        t: f.ts.toFixed(2),
        baselineErr: Math.abs(f.setpoint - f.output_baseline),
        aacErr: Math.abs(f.setpoint - f.output_aac),
        setpoint: f.setpoint,
        outAac: f.output_aac,
        outBase: f.output_baseline,
      })),
    wear: wearFull.filter((_, i) => i % downsample === 0),
    gains: sorted.filter((_, i) => i % downsample === 0).map((f) => ({
      t: f.ts.toFixed(2),
      kp: f.kp,
      ki: f.ki,
      kd: f.kd,
    })),
    rewards: sorted
      .map((f, idx) => ({ f, idx }))
      .filter(({ idx }) => idx % downsample === 0)
      .map(({ f, idx }) => ({
        t: f.ts.toFixed(2),
        reward: f.reward,
        rewardBaseProxy: rewardsBase[idx] ?? baselineRewardProxy,
      })),
    confidence: sorted.filter((_, i) => i % downsample === 0).map((f) => ({
      t: f.ts.toFixed(2),
      confidence: f.confidence,
      fallback: f.fallback_level,
    })),
    latency: sorted.filter((_, i) => i % downsample === 0).map((f) => ({
      t: f.ts.toFixed(2),
      latency: f.latency_ms,
    })),
    resolution: sorted.filter((_, i) => i % downsample === 0).map((f) => ({
      t: f.ts.toFixed(2),
      resolution: f.resolution_level,
    })),
  };

  const core: Omit<Report, "narrative" | "telemetrySnapshot"> = {
    meta,
    executive,
    tracking: { baseline: baseTrack, aac: aacTrack },
    wear: {
      totalValveMovement: movementAac,
      totalBaselineMovement: movementBase,
      wearReductionPct,
      jitterSuppressionPct,
      deadbandEfficiencyScore,
    },
    pid: {
      gainVariance,
      gainSmoothnessScore,
      oscillationIntensityIndex,
      adaptationEfficiency,
      stabilityRecoveryTime,
      adaptationResponsiveness,
      contextSwitchEfficiencyPct: ctxEff,
    },
    rl: {
      avgReward,
      baselineRewardProxy,
      rewardImprovementPct,
      convergenceStability: conv,
      baselineConvergenceStability,
      explorationVsStability,
      policyConfidenceScore,
    },
    uncertainty: {
      avgConfidence: avgConf,
      unsafeDetections: unsafe,
      fallbackTriggerFrames: fallbackFrames,
      recoverySuccessRate,
      disturbanceStabilityScore,
    },
    latency: {
      avgLatencyMs: avgLat,
      peakLatencyMs: peakLat,
      realtimeStabilityPct,
      edgeEfficiencyScore,
    },
    cmac: {
      highActivityRegions: highAct,
      sparseStatePct,
      adaptiveResolutionEfficiency,
      regionUtilization: util,
    },
    scorecard,
    finalAacScore,
    charts,
  };

  const narrative = buildNarrative(core, sorted);

  return {
    ...core,
    narrative,
    telemetrySnapshot: sorted,
  };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : ((s[m - 1]! + s[m]!) / 2);
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = clamp(Math.floor(p * (s.length - 1)), 0, s.length - 1);
  return s[idx]!;
}

function corr(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const ma = mean(ax);
  const mb = mean(bx);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = ax[i]! - ma;
    const xb = bx[i]! - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const den = Math.sqrt(da) * Math.sqrt(db);
  return den === 0 ? 0 : clamp(num / den, -1, 1);
}

function safePct01(x: number | null): number {
  if (x === null || !Number.isFinite(x)) return 0.5;
  return clamp(x / 100 + 0.5, 0, 1);
}
