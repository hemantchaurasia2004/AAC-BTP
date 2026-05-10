from __future__ import annotations

from collections import deque
from typing import Any


class TelemetryHistory:
    def __init__(self, maxlen: int = 2500) -> None:
        self._data: deque[dict[str, Any]] = deque(maxlen=maxlen)

    def push(self, frame: dict[str, Any]) -> None:
        self._data.append(frame)

    def snapshot(self) -> list[dict[str, Any]]:
        return list(self._data)
