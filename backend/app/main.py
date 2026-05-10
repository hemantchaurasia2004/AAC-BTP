from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.control import router as control_router
from app.api.routes.research import router as research_router
from app.runtime import runtime
from app.ws.telemetry_stream import router as ws_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await runtime.start()
    yield


app = FastAPI(title="AAC Backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.include_router(control_router, prefix="/api")
app.include_router(research_router, prefix="/api")
app.include_router(ws_router)
