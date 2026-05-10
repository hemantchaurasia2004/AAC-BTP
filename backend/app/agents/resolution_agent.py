from __future__ import annotations


class ResolutionAgent:
    def adjust(self, confidence: float, tracking_error: float) -> int:
        if confidence < 0.5:
            return 12
        if abs(tracking_error) > 0.2:
            return 10
        if abs(tracking_error) < 0.05:
            return 4
        return 7
