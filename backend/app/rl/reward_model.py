from __future__ import annotations


def compute_reward(tracking_error: float, control_energy: float, confidence: float, jitter_freeze: bool) -> float:
    penalty = abs(tracking_error) * 2.4 + control_energy * 0.35 + (1.0 - confidence) * 1.5
    freeze_bonus = 0.1 if jitter_freeze else 0.0
    return 1.4 - penalty + freeze_bonus
