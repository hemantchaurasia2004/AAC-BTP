from __future__ import annotations

from dataclasses import dataclass
import numpy as np

from app.models import PIDGains

KP_MIN, KP_MAX = 0.4, 4.5
KI_MIN, KI_MAX = 0.0, 0.8
KD_MIN, KD_MAX = 0.0, 0.6
MAX_GAIN_STEP = 0.03
SMOOTHING_ALPHA = 0.06


@dataclass
class PIDState:
    integral: float = 0.0
    prev_error: float = 0.0
    prev_control: float = 0.0


class PIDController:
    def __init__(self, gains: PIDGains) -> None:
        self.gains = self.clip_gains(gains)
        self.state = PIDState()

    def update_gains(self, gains: PIDGains) -> None:
        self.gains = self.clip_gains(gains)

    @staticmethod
    def clip_gains(gains: PIDGains) -> PIDGains:
        return PIDGains(
            kp=float(np.clip(gains.kp, KP_MIN, KP_MAX)),
            ki=float(np.clip(gains.ki, KI_MIN, KI_MAX)),
            kd=float(np.clip(gains.kd, KD_MIN, KD_MAX)),
        )

    @staticmethod
    def stabilized_gain_update(old: PIDGains, candidate: PIDGains) -> PIDGains:
        clipped = PIDController.clip_gains(candidate)
        smoothed = PIDGains(
            kp=SMOOTHING_ALPHA * clipped.kp + (1.0 - SMOOTHING_ALPHA) * old.kp,
            ki=SMOOTHING_ALPHA * clipped.ki + (1.0 - SMOOTHING_ALPHA) * old.ki,
            kd=SMOOTHING_ALPHA * clipped.kd + (1.0 - SMOOTHING_ALPHA) * old.kd,
        )
        kp = old.kp + float(np.clip(smoothed.kp - old.kp, -MAX_GAIN_STEP, MAX_GAIN_STEP))
        ki = old.ki + float(np.clip(smoothed.ki - old.ki, -MAX_GAIN_STEP, MAX_GAIN_STEP))
        kd = old.kd + float(np.clip(smoothed.kd - old.kd, -MAX_GAIN_STEP, MAX_GAIN_STEP))
        return PIDController.clip_gains(PIDGains(kp=kp, ki=ki, kd=kd))

    def step(
        self,
        setpoint: float,
        measured: float,
        dt: float,
        freeze_integral: bool = False,
        micro_threshold: float = 0.002,
        low_pass_beta: float = 0.08,
    ) -> float:
        error = setpoint - measured
        if not freeze_integral:
            self.state.integral += error * dt
        self.state.integral = float(np.clip(self.state.integral, -1.2, 1.2))
        derivative = (error - self.state.prev_error) / dt if dt > 0 else 0.0
        self.state.prev_error = error
        u_raw = self.gains.kp * error + self.gains.ki * self.state.integral + self.gains.kd * derivative
        u_sat = float(np.clip(u_raw, 0.0, 1.0))
        u_filtered = low_pass_beta * u_sat + (1.0 - low_pass_beta) * self.state.prev_control
        if abs(u_filtered - self.state.prev_control) < micro_threshold:
            u_filtered = self.state.prev_control
        self.state.prev_control = float(np.clip(u_filtered, 0.0, 1.0))
        return self.state.prev_control
