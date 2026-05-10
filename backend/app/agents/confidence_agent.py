from __future__ import annotations

import numpy as np


class ConfidenceAgent:
    def score(self, state: float, setpoint: float, unseen_zone_boost: float) -> float:
        center_dist = abs(state - setpoint)
        unseen_penalty = unseen_zone_boost if state > 0.9 else 0.0
        val = 1.0 - (0.7 * center_dist + unseen_penalty)
        return float(np.clip(val, 0.0, 1.0))
