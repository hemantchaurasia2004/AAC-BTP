from __future__ import annotations

from app.models import OperatingMode


class ContextualizationAgent:
    def __init__(self) -> None:
        self.current_mode = OperatingMode.STABLE_PRODUCTION
        self._candidate_mode = self.current_mode
        self._candidate_frames = 0
        self._locked_until_s = 0.0

    def _infer_mode(self, tracking_error: float, confidence: float, control_energy: float) -> OperatingMode:
        if confidence < 0.45:
            return OperatingMode.SAFETY_CRITICAL
        if tracking_error > 0.22:
            return OperatingMode.HIGH_PERFORMANCE
        if control_energy > 0.6:
            return OperatingMode.ENERGY_SAVING
        return OperatingMode.STABLE_PRODUCTION

    def detect_mode(
        self,
        tracking_error: float,
        confidence: float,
        control_energy: float,
        now_s: float,
        min_hold_s: float = 6.0,
        min_persist_frames: int = 4,
    ) -> OperatingMode:
        target_mode = self._infer_mode(tracking_error, confidence, control_energy)
        if now_s < self._locked_until_s:
            return self.current_mode

        if target_mode == self.current_mode:
            self._candidate_mode = target_mode
            self._candidate_frames = 0
            return self.current_mode

        if target_mode == self._candidate_mode:
            self._candidate_frames += 1
        else:
            self._candidate_mode = target_mode
            self._candidate_frames = 1

        if self._candidate_frames >= min_persist_frames and confidence > 0.5:
            self.current_mode = target_mode
            self._locked_until_s = now_s + min_hold_s
            self._candidate_frames = 0
        return self.current_mode
