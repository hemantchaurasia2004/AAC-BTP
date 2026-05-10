import { describe, expect, it } from "vitest";
import { toExportRows } from "./telemetryTransformers";

describe("telemetry transformer", () => {
  it("maps telemetry rows", () => {
    const rows = toExportRows([
      {
        ts: 1,
        dt_ms: 200,
        scenario: "normal_operation",
        mode: "stable_production",
        setpoint: 0.8,
        output_aac: 0.7,
        output_baseline: 0.66,
        control_aac: 0.2,
        control_baseline: 0.2,
        kp: 1,
        ki: 1,
        kd: 1,
        confidence: 0.7,
        reward: 0.6,
        latency_ms: 3,
        jitter_metric: 0.01,
        jitter_freeze_active: false,
        resolution_level: 4,
        fallback_level: 0,
        tracking_error: 0.1,
        overshoot: 0,
        settling_time_proxy: 0.2,
        control_energy: 0.2,
        actuator_wear_index: 0.1,
        oscillation_intensity_index: 0.01,
        gain_smoothness_index: 78,
        adaptation_efficiency: 1.0,
        stability_recovery_time: 0.2,
        deadband_width: 0.03,
        system_health: 0.9,
        tank_level: 0.3,
        flow_rate: 0.4,
        valve_position: 0.4,
        pressure: 0.5,
        deployment_status: "idle",
        policy_sync_status: "in-sync",
        agent_logs: [],
      },
    ]);
    expect(rows[0].output_aac).toBe(0.7);
  });
});
