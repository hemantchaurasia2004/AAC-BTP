from __future__ import annotations

from dataclasses import dataclass

from app.models import Scenario


@dataclass
class ScenarioConfig:
    noise_std: float
    disturbance: float
    setpoint: float
    unseen_zone_boost: float
    actuator_degradation: float


SCENARIO_CONFIGS: dict[Scenario, ScenarioConfig] = {
    Scenario.NORMAL: ScenarioConfig(0.01, 0.0, 0.65, 0.0, 0.0),
    Scenario.HIGH_PERFORMANCE_DEMAND: ScenarioConfig(0.012, 0.0, 0.85, 0.0, 0.0),
    Scenario.SENSOR_NOISE_ATTACK: ScenarioConfig(0.05, 0.0, 0.65, 0.0, 0.0),
    Scenario.SUDDEN_DISTURBANCE: ScenarioConfig(0.015, 0.15, 0.65, 0.0, 0.0),
    Scenario.UNSEEN_STATE_REGION: ScenarioConfig(0.02, 0.0, 0.72, 0.25, 0.0),
    Scenario.ACTUATOR_DEGRADATION: ScenarioConfig(0.015, 0.04, 0.65, 0.0, 0.25),
}
