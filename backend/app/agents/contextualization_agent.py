from __future__ import annotations

from app.models import OperatingMode


class ContextualizationAgent:
    def detect_mode(self, tracking_error: float, confidence: float, control_energy: float) -> OperatingMode:
        if confidence < 0.45:
            return OperatingMode.SAFETY_CRITICAL
        if tracking_error > 0.22:
            return OperatingMode.HIGH_PERFORMANCE
        if control_energy > 0.6:
            return OperatingMode.ENERGY_SAVING
        return OperatingMode.STABLE_PRODUCTION
