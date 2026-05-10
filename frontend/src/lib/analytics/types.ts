import type { Scenario, TelemetryFrame } from "@/types/telemetry";

export type TrackingMetrics = {
  rmse: number;
  meanAbsError: number;
  overshootPct: number;
  settlingProxy: number;
  riseProxy: number;
  stabilityScore: number;
};

export type WearMetrics = {
  totalValveMovement: number;
  totalBaselineMovement: number;
  wearReductionPct: number | null;
  jitterSuppressionPct: number | null;
  deadbandEfficiencyScore: number;
};

export type PidAdaptationMetrics = {
  gainVariance: number;
  gainSmoothnessScore: number;
  adaptationResponsiveness: number;
  contextSwitchEfficiencyPct: number;
};

export type RlOptimizationMetrics = {
  avgReward: number;
  baselineRewardProxy: number;
  rewardImprovementPct: number | null;
  convergenceStability: number;
  baselineConvergenceStability: number;
  explorationVsStability: number;
  policyConfidenceScore: number;
};

export type UncertaintySafetyMetrics = {
  avgConfidence: number;
  unsafeDetections: number;
  fallbackTriggerFrames: number;
  recoverySuccessRate: number | null;
  disturbanceStabilityScore: number;
};

export type LatencyEdgeMetrics = {
  avgLatencyMs: number;
  peakLatencyMs: number;
  realtimeStabilityPct: number;
  edgeEfficiencyScore: number;
};

export type CmacMetrics = {
  highActivityRegions: number;
  sparseStatePct: number;
  adaptiveResolutionEfficiency: number;
  regionUtilization: Record<number, number>;
};

export type Scorecard = {
  stability: number;
  adaptability: number;
  efficiency: number;
  safety: number;
  smoothness: number;
  intelligence: number;
};

export type CycleAnalyticsReport = {
  meta: {
    generatedAtIso: string;
    frameCount: number;
    durationSec: number;
    dominantScenario: Scenario;
    tickMsMedian: number;
    triggerReason: "time_cycle" | "scenario_change" | "manual";
  };
  executive: {
    healthScore: number;
    optimizationEfficiencyPct: number;
    actuatorPreservationPct: number | null;
    adaptiveIntelligencePct: number;
  };
  tracking: {
    baseline: TrackingMetrics;
    aac: TrackingMetrics;
  };
  wear: WearMetrics;
  pid: PidAdaptationMetrics;
  rl: RlOptimizationMetrics;
  uncertainty: UncertaintySafetyMetrics;
  latency: LatencyEdgeMetrics;
  cmac: CmacMetrics;
  narrative: string;
  scorecard: Scorecard;
  finalAacScore: number;
  telemetrySnapshot: TelemetryFrame[];
  charts: {
    tracking: { t: string; baselineErr: number; aacErr: number; setpoint: number; outAac: number; outBase: number }[];
    wear: { t: string; movAac: number; movBase: number }[];
    gains: { t: string; kp: number; ki: number; kd: number }[];
    rewards: { t: string; reward: number; rewardBaseProxy: number }[];
    confidence: { t: string; confidence: number; fallback: number }[];
    latency: { t: string; latency: number }[];
    resolution: { t: string; resolution: number }[];
  };
};
