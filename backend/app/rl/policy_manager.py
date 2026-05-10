from __future__ import annotations

from app.models import OperatingMode, PIDGains


class PolicyManager:
    def propose_gains(self, mode: OperatingMode, base: PIDGains, confidence: float) -> PIDGains:
        scale = max(0.75, min(1.25, 0.9 + confidence * 0.4))
        if mode == OperatingMode.HIGH_PERFORMANCE:
            return PIDGains(kp=base.kp * 1.18 * scale, ki=base.ki * 1.08, kd=base.kd * 1.15)
        if mode == OperatingMode.ENERGY_SAVING:
            return PIDGains(kp=base.kp * 0.85, ki=base.ki * 0.85, kd=base.kd * 0.75)
        if mode == OperatingMode.SAFETY_CRITICAL:
            return PIDGains(kp=base.kp * 0.72, ki=base.ki * 0.7, kd=base.kd * 0.8)
        return PIDGains(kp=base.kp * scale, ki=base.ki, kd=base.kd)
