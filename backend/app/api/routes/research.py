from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/research", tags=["research"])


@router.get("/highlights")
async def highlights() -> dict:
    return {
        "methodology": "Hierarchical agentic adaptation over CMAC-DDPID baseline",
        "reported_metrics": [
            "tracking_error",
            "overshoot",
            "settling_time_proxy",
            "control_energy",
            "actuator_wear_index",
            "confidence",
        ],
    }
