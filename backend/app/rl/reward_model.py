from __future__ import annotations


def compute_reward(
    tracking_error: float,
    overshoot: float,
    oscillation_metric: float,
    control_energy: float,
    gain_change_penalty: float,
    uncertainty_penalty: float,
    context_switch_penalty: float,
    jitter_freeze: bool,
    settled: bool,
) -> float:
    tracking_accuracy = 1.2 - 2.0 * abs(tracking_error)
    overshoot_penalty = 2.2 * overshoot
    oscillation_penalty = 1.8 * oscillation_metric
    actuator_wear_penalty = 0.7 * control_energy
    gain_penalty = 1.1 * gain_change_penalty
    uncertainty_term = 1.3 * uncertainty_penalty
    switch_penalty = 0.5 * context_switch_penalty
    settling_bonus = 0.25 if settled else 0.0
    smoothness_bonus = 0.12 if gain_change_penalty < 0.01 else 0.0
    deadband_bonus = 0.08 if jitter_freeze else 0.0
    return (
        tracking_accuracy
        - overshoot_penalty
        - oscillation_penalty
        - actuator_wear_penalty
        - gain_penalty
        - uncertainty_term
        - switch_penalty
        + settling_bonus
        + smoothness_bonus
        + deadband_bonus
    )
