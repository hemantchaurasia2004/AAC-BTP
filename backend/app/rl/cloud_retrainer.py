from __future__ import annotations

from app.models import PIDGains


class CloudRetrainer:
    def __init__(self) -> None:
        self.pending = False

    def maybe_retrain(self, confidence: float, stable_gains: PIDGains) -> PIDGains:
        self.pending = confidence < 0.45
        if not self.pending:
            return stable_gains
        return PIDGains(
            kp=max(0.8, stable_gains.kp * 0.95),
            ki=max(0.2, stable_gains.ki * 0.97),
            kd=max(0.04, stable_gains.kd * 0.93),
        )
