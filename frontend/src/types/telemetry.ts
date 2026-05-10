export type Scenario =
  | "normal_operation"
  | "high_performance_demand"
  | "sensor_noise_attack"
  | "sudden_disturbance"
  | "unseen_state_region"
  | "actuator_degradation";

export interface TelemetryFrame {
  ts: number;
  dt_ms: number;
  scenario: Scenario;
  mode: string;
  setpoint: number;
  output_aac: number;
  output_baseline: number;
  control_aac: number;
  control_baseline: number;
  kp: number;
  ki: number;
  kd: number;
  confidence: number;
  reward: number;
  latency_ms: number;
  jitter_metric: number;
  jitter_freeze_active: boolean;
  resolution_level: number;
  fallback_level: number;
  tracking_error: number;
  overshoot: number;
  settling_time_proxy: number;
  control_energy: number;
  actuator_wear_index: number;
  oscillation_intensity_index: number;
  gain_smoothness_index: number;
  adaptation_efficiency: number;
  stability_recovery_time: number;
  deadband_width: number;
  system_health: number;
  tank_level: number;
  flow_rate: number;
  valve_position: number;
  pressure: number;
  deployment_status: string;
  policy_sync_status: string;
  agent_logs: string[];
}
