from __future__ import annotations

import numpy as np

from app.simulation.scenarios import ScenarioConfig


class NonlinearPlant:
    def __init__(self) -> None:
        self.state = 0.2
        self.flow_rate = 0.0
        self.pressure = 0.15
        self.tank_level = 0.2
        self.actuator_wear = 0.0
        self.rng = np.random.default_rng(42)

    def step(self, control_signal: float, cfg: ScenarioConfig, dt: float) -> float:
        actuator_penalty = 1.0 - min(0.7, cfg.actuator_degradation + self.actuator_wear * 0.3)
        effective_u = np.clip(control_signal * actuator_penalty, -1.0, 1.0)
        nonlinear_drag = 0.45 * self.state**2
        dynamics = 1.2 * effective_u - nonlinear_drag + cfg.disturbance
        process_noise = float(self.rng.normal(0.0, cfg.noise_std))
        self.state = float(np.clip(self.state + dt * dynamics + process_noise, 0.0, 1.2))

        self.flow_rate = float(np.clip(0.4 + effective_u * 0.5, 0.0, 1.0))
        self.pressure = float(np.clip(0.2 + self.state * 0.7 + cfg.disturbance * 0.2, 0.0, 1.3))
        self.tank_level = float(np.clip(0.1 + self.state * 0.8, 0.0, 1.0))
        self.actuator_wear = float(np.clip(self.actuator_wear + abs(effective_u) * dt * 0.01, 0.0, 1.0))
        return self.state
