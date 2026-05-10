from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.models import Scenario
from app.runtime import runtime

router = APIRouter(prefix="/control", tags=["control"])


class ControlConfig(BaseModel):
    scenario: Scenario | None = None
    tick_ms: int | None = None


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/configure")
async def configure(payload: ControlConfig) -> dict[str, str]:
    if payload.scenario is not None:
        runtime.set_scenario(payload.scenario)
    if payload.tick_ms is not None:
        runtime.set_tick_ms(payload.tick_ms)
    return {"status": "updated"}


@router.get("/history")
async def history() -> list[dict]:
    return runtime.history.snapshot()
