import { describe, expect, it } from "vitest";
import { computeCycleAnalytics } from "./computeCycleAnalytics";
import type { TelemetryFrame } from "@/types/telemetry";

function buildFrame(ts: number, overrides: Partial<TelemetryFrame>): TelemetryFrame {
  const base: TelemetryFrame = {
    ts,
    dt_ms: 200,
    scenario: "normal_operation",
    mode: "stable_production",
    setpoint: 0.8,
    output_aac: 0.65,
    output_baseline: 0.6,
    control_aac: 0.1,
    control_baseline: 0.15,
    kp: 1.1,
    ki: 0.4,
    kd: 0.1,
    confidence: 0.75,
    reward: -0.2,
    latency_ms: 3,
    jitter_metric: 0.01,
    jitter_freeze_active: false,
    resolution_level: 4,
    fallback_level: 0,
    tracking_error: 0.08,
    overshoot: 0,
    settling_time_proxy: 0.1,
    control_energy: 0.08,
    actuator_wear_index: 0.05,
    oscillation_intensity_index: 0.01,
    gain_smoothness_index: 80,
    adaptation_efficiency: 1.2,
    stability_recovery_time: 0.4,
    deadband_width: 0.03,
    system_health: 0.92,
    tank_level: 0.55,
    flow_rate: 0.62,
    valve_position: 0.53,
    pressure: 0.48,
    deployment_status: "healthy",
    policy_sync_status: "in-sync",
    agent_logs: [],
  };
  return { ...base, ...overrides };
}

describe("computeCycleAnalytics", () => {
  it("returns deterministic aggregates for a synthetic AAC-favorable trace", () => {
    const frames: TelemetryFrame[] = [];
    for (let i = 0; i < 120; i++) {
      const t = i * 0.2;
      const ripple = Math.sin(i / 9) * 0.015;
      const baseOut = 0.78 + ripple * 1.25;
      const aacErr = ripple * 0.35;
      const baseErr = ripple * 1.1;
      frames.push(
        buildFrame(t, {
          output_aac: baseOut + aacErr,
          output_baseline: baseOut + baseErr,
          control_aac: ripple * 0.4,
          control_baseline: ripple * 0.95 + 0.02 * Math.sign(ripple || 1),
          reward: (-0.1 * i) / 120,
          latency_ms: 2.8 + Math.sin(i) * 0.2,
          resolution_level: i % 20 < 12 ? 4 : 3,
        }),
      );
    }

    const r = computeCycleAnalytics(frames, "time_cycle");

    expect(r.meta.frameCount).toBe(120);
    expect(r.tracking.aac.rmse).toBeLessThanOrEqual(r.tracking.baseline.rmse + 1e-6);
    expect(r.wear.totalValveMovement).toBeGreaterThan(0);
    expect(r.finalAacScore).toBeGreaterThan(0);
    expect(r.finalAacScore).toBeLessThanOrEqual(100);
    expect(r.charts.tracking.length).toBeGreaterThan(0);
  });
});
