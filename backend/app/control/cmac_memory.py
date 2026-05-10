from __future__ import annotations

import numpy as np

from app.models import PIDGains


class MultiResolutionCMAC:
    def __init__(self) -> None:
        self.resolution = 4
        self.memory: dict[tuple[int, int], PIDGains] = {}

    def set_resolution(self, resolution: int) -> None:
        self.resolution = max(2, min(16, resolution))

    def _key(self, state: float, setpoint: float) -> tuple[int, int]:
        s_bin = int(np.clip(state * self.resolution, 0, self.resolution - 1))
        sp_bin = int(np.clip(setpoint * self.resolution, 0, self.resolution - 1))
        return (s_bin, sp_bin)

    def retrieve(self, state: float, setpoint: float) -> PIDGains:
        return self.memory.get(self._key(state, setpoint), PIDGains(kp=1.2, ki=0.45, kd=0.12))

    def write(self, state: float, setpoint: float, gains: PIDGains) -> None:
        self.memory[self._key(state, setpoint)] = gains
