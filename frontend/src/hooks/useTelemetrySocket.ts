"use client";

import { useEffect } from "react";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import type { TelemetryFrame } from "@/types/telemetry";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/telemetry";

export function useTelemetrySocket() {
  const setConnected = useTelemetryStore((s) => s.setConnected);
  const pushFrame = useTelemetryStore((s) => s.pushFrame);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const frame = JSON.parse(event.data) as TelemetryFrame;
      pushFrame(frame);
      ws.send("ack");
    };
    return () => ws.close();
  }, [pushFrame, setConnected]);
}
