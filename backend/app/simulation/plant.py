from __future__ import annotations

import numpy as np

from app.simulation.scenarios import ScenarioConfig


class NonlinearPlant:
    def __init__(self) -> None:
        self.state = 0.2
        self.state_velocity = 0.0
        self.flow_rate = 0.0
        self.pressure = 0.15
        self.tank_level = 0.2
        self.actuator_wear = 0.0
        self.actuator_state = 0.0
        self.rng = np.random.default_rng(42)

    def step(self, control_signal: float, cfg: ScenarioConfig, dt: float) -> float:
        actuator_penalty = 1.0 - min(0.7, cfg.actuator_degradation + self.actuator_wear * 0.3)
        command_u = float(np.clip(control_signal, 0.0, 1.0))
        actuator_tau = 0.85
        self.actuator_state += dt * (command_u - self.actuator_state) / max(actuator_tau, 1e-6)
        self.actuator_state = float(np.clip(self.actuator_state, 0.0, 1.0))
        effective_u = float(np.clip(self.actuator_state * actuator_penalty, 0.0, 1.0))
        zeta = 1.05
        wn = 1.25
        nonlinear_drag = 0.3 * self.state**2
        accel = (wn**2) * (effective_u - self.state) - 2.0 * zeta * wn * self.state_velocity - nonlinear_drag + cfg.disturbance
        process_noise = float(self.rng.normal(0.0, cfg.noise_std))
        self.state_velocity = float(np.clip(self.state_velocity + dt * accel, -2.0, 2.0))
        self.state = float(np.clip(self.state + dt * self.state_velocity + process_noise, 0.0, 1.2))

        self.flow_rate = float(np.clip(0.28 + effective_u * 0.55, 0.0, 1.0))
        self.pressure = float(np.clip(0.2 + self.state * 0.7 + cfg.disturbance * 0.2, 0.0, 1.3))
        self.tank_level = float(np.clip(0.1 + self.state * 0.8, 0.0, 1.0))
        wear_delta = abs(command_u - self.actuator_state) + abs(effective_u)
        self.actuator_wear = float(np.clip(self.actuator_wear + wear_delta * dt * 0.004, 0.0, 1.0))
        return self.state
