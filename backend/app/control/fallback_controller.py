from __future__ import annotations

from app.models import PIDGains


class FallbackController:
    def __init__(self) -> None:
        self.last_stable = PIDGains(kp=1.1, ki=0.4, kd=0.1)
        self.level = 0

    def update_stable(self, gains: PIDGains, confidence: float) -> None:
        if confidence > 0.75:
            self.last_stable = gains

    def select(self, confidence: float, severe: bool) -> PIDGains:
        if severe:
            self.level = 3
            return PIDGains(kp=0.8, ki=0.25, kd=0.05)
        if confidence < 0.45:
            self.level = 2
            return self.last_stable
        if confidence < 0.6:
            self.level = 1
            return self.last_stable
        self.level = 0
        return self.last_stable
