from __future__ import annotations


class JitterMitigationAgent:
    def __init__(self) -> None:
        self.freeze_active = False
        self.deadband = 0.02

    def evaluate(
        self,
        tracking_error: float,
        error_derivative: float,
        oscillation_metric: float,
        noise_estimate: float,
    ) -> bool:
        base_deadband = 0.015
        self.deadband = base_deadband + 0.8 * noise_estimate + 0.35 * oscillation_metric
        steady_state = (
            abs(tracking_error) < self.deadband
            and abs(error_derivative) < 0.08
            and oscillation_metric < 0.06
        )
        self.freeze_active = steady_state
        return self.freeze_active
