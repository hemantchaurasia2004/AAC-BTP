from __future__ import annotations

import numpy as np


class ConfidenceAgent:
    def __init__(self) -> None:
        self._rolling_instability = 0.0

    def score(
        self,
        state: float,
        setpoint: float,
        unseen_zone_boost: float,
        oscillation_metric: float,
        gain_variance: float,
        wear_metric: float,
        overshoot: float,
    ) -> float:
        center_dist = abs(state - setpoint)
        unseen_penalty = unseen_zone_boost if state > 0.9 else 0.0
        normalized_error = min(1.0, center_dist / max(abs(setpoint), 1e-6))
        raw_instability = (
            0.55 * normalized_error
            + 0.35 * oscillation_metric
            + 0.25 * min(1.0, gain_variance * 6.0)
            + 0.2 * wear_metric
            + 0.3 * overshoot
            + unseen_penalty
        )
        self._rolling_instability = 0.9 * self._rolling_instability + 0.1 * raw_instability
        val = 1.0 / (1.0 + raw_instability + 0.8 * self._rolling_instability)
        return float(np.clip(val, 0.0, 1.0))
