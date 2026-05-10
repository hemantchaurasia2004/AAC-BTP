from __future__ import annotations

from dataclasses import dataclass

from app.models import PIDGains


@dataclass
class PIDState:
    integral: float = 0.0
    prev_error: float = 0.0


class PIDController:
    def __init__(self, gains: PIDGains) -> None:
        self.gains = gains
        self.state = PIDState()

    def update_gains(self, gains: PIDGains) -> None:
        self.gains = gains

    def step(self, setpoint: float, measured: float, dt: float) -> float:
        error = setpoint - measured
        self.state.integral += error * dt
        derivative = (error - self.state.prev_error) / dt if dt > 0 else 0.0
        self.state.prev_error = error
        u = self.gains.kp * error + self.gains.ki * self.state.integral + self.gains.kd * derivative
        return max(-1.0, min(1.0, u))
