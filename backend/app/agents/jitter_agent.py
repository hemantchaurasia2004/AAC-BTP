from __future__ import annotations


class JitterMitigationAgent:
    def __init__(self) -> None:
        self.freeze_active = False

    def evaluate(self, tracking_error: float, noise_estimate: float) -> bool:
        self.freeze_active = abs(tracking_error) < 0.03 and noise_estimate > 0.03
        return self.freeze_active
