from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.runtime import runtime

router = APIRouter()


@router.websocket("/ws/telemetry")
async def telemetry_socket(websocket: WebSocket) -> None:
    await runtime.manager.connect(websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        runtime.manager.disconnect(websocket)
