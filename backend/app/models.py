from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


class OperatingMode(str, Enum):
    HIGH_PERFORMANCE = "high_performance"
    ENERGY_SAVING = "energy_saving"
    STABLE_PRODUCTION = "stable_production"
    SAFETY_CRITICAL = "safety_critical"


class Scenario(str, Enum):
    NORMAL = "normal_operation"
    HIGH_PERFORMANCE_DEMAND = "high_performance_demand"
    SENSOR_NOISE_ATTACK = "sensor_noise_attack"
    SUDDEN_DISTURBANCE = "sudden_disturbance"
    UNSEEN_STATE_REGION = "unseen_state_region"
    ACTUATOR_DEGRADATION = "actuator_degradation"


class PIDGains(BaseModel):
    kp: float
    ki: float
    kd: float


class TelemetryFrame(BaseModel):
    ts: float
    dt_ms: int
    scenario: Scenario
    mode: OperatingMode
    setpoint: float
    output_aac: float
    output_baseline: float
    control_aac: float
    control_baseline: float
    kp: float
    ki: float
    kd: float
    confidence: float = Field(ge=0.0, le=1.0)
    reward: float
    latency_ms: float
    jitter_metric: float
    jitter_freeze_active: bool
    resolution_level: int
    fallback_level: int
    tracking_error: float
    overshoot: float
    settling_time_proxy: float
    control_energy: float
    actuator_wear_index: float
    system_health: float
    tank_level: float
    flow_rate: float
    valve_position: float
    pressure: float
    deployment_status: str
    policy_sync_status: str
    agent_logs: list[str]
