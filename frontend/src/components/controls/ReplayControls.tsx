"use client";

import { useTelemetryStore } from "@/store/useTelemetryStore";

export function ReplayControls() {
  const replayMode = useTelemetryStore((s) => s.replayMode);
  const setReplayMode = useTelemetryStore((s) => s.setReplayMode);
  const speedMultiplier = useTelemetryStore((s) => s.speedMultiplier);
  const setSpeedMultiplier = useTelemetryStore((s) => s.setSpeedMultiplier);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-medium text-slate-600">Replay & Speed</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setReplayMode(!replayMode)}
          className="rounded bg-indigo-600 px-3 py-1 text-xs text-white"
        >
          {replayMode ? "Disable Replay" : "Enable Replay"}
        </button>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
        />
        <span className="text-xs text-slate-600">{speedMultiplier.toFixed(1)}x</span>
      </div>
    </div>
  );
}
