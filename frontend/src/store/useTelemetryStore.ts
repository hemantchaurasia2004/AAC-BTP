"use client";

import { create } from "zustand";
import type { Scenario, TelemetryFrame } from "@/types/telemetry";
import { computeCycleAnalytics } from "@/lib/analytics/computeCycleAnalytics";
import type { CycleAnalyticsReport } from "@/lib/analytics/types";

const MAX_POINTS = 240;
const MAX_CYCLE_FRAMES = 4000;
const MIN_FRAMES_FOR_ANALYTICS = 12;

/** Runtime telemetry accumulators (bounded histories) mirrored from the live WebSocket feed. */
export type MetricsBufferSnapshot = {
  tracking_error_history: number[];
  gain_history: { kp: number; ki: number; kd: number }[];
  control_signal_history: { aac: number; baseline: number }[];
  actuator_movement: { aac: number; baseline: number }[];
  confidence_history: number[];
  latency_history: number[];
  reward_history: number[];
  output_aac_history: number[];
  context_modes: string[];
  fallback_events: number[];
};

interface TelemetryState {
  connected: boolean;
  latest?: TelemetryFrame;
  frames: TelemetryFrame[];
  replayMode: boolean;
  speedMultiplier: number;
  scenario: Scenario;
  analyticsReport: CycleAnalyticsReport | null;
  metricsBuffer: MetricsBufferSnapshot;
  setConnected: (v: boolean) => void;
  pushFrame: (frame: TelemetryFrame) => void;
  setScenario: (v: Scenario) => void;
  setReplayMode: (v: boolean) => void;
  setSpeedMultiplier: (v: number) => void;
  /** Build analytics from the current telemetry buffer (manual only). */
  buildAnalyticsReport: () => boolean;
  clearAnalyticsReport: () => void;
}

function trim<T>(arr: T[]): T[] {
  return arr.length > MAX_CYCLE_FRAMES ? arr.slice(-MAX_CYCLE_FRAMES) : arr;
}

function emptyBuffer(): MetricsBufferSnapshot {
  return {
    tracking_error_history: [],
    gain_history: [],
    control_signal_history: [],
    actuator_movement: [],
    confidence_history: [],
    latency_history: [],
    reward_history: [],
    output_aac_history: [],
    context_modes: [],
    fallback_events: [],
  };
}

function appendBuffer(prev: MetricsBufferSnapshot, frame: TelemetryFrame, prevCycleFrame?: TelemetryFrame): MetricsBufferSnapshot {
  const movA =
    prevCycleFrame !== undefined ? Math.abs(frame.control_aac - prevCycleFrame.control_aac) : 0;
  const movB =
    prevCycleFrame !== undefined
      ? Math.abs(frame.control_baseline - prevCycleFrame.control_baseline)
      : 0;

  return {
    tracking_error_history: trim([...prev.tracking_error_history, frame.tracking_error]),
    gain_history: trim([...prev.gain_history, { kp: frame.kp, ki: frame.ki, kd: frame.kd }]),
    control_signal_history: trim([
      ...prev.control_signal_history,
      { aac: frame.control_aac, baseline: frame.control_baseline },
    ]),
    actuator_movement: trim([...prev.actuator_movement, { aac: movA, baseline: movB }]),
    confidence_history: trim([...prev.confidence_history, frame.confidence]),
    latency_history: trim([...prev.latency_history, frame.latency_ms]),
    reward_history: trim([...prev.reward_history, frame.reward]),
    output_aac_history: trim([...prev.output_aac_history, frame.output_aac]),
    context_modes: trim([...prev.context_modes, frame.mode]),
    fallback_events: trim([...prev.fallback_events, frame.fallback_level > 0 ? 1 : 0]),
  };
}

function presentReport(
  frames: TelemetryFrame[],
  reason: CycleAnalyticsReport["meta"]["triggerReason"],
): { report: CycleAnalyticsReport; open: boolean } | null {
  if (frames.length < MIN_FRAMES_FOR_ANALYTICS) return null;
  return { report: computeCycleAnalytics(frames, reason), open: true };
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  connected: false,
  latest: undefined,
  frames: [],
  replayMode: false,
  speedMultiplier: 1,
  scenario: "normal_operation",
  analyticsReport: null,
  metricsBuffer: emptyBuffer(),

  setConnected: (v) => set({ connected: v }),

  pushFrame: (frame) =>
    set((state) => {
      const nextFrames = [...state.frames.slice(-(MAX_POINTS - 1)), frame];
      const prevFrame = nextFrames.length >= 2 ? nextFrames[nextFrames.length - 2] : undefined;
      const nextBuffer = appendBuffer(state.metricsBuffer, frame, prevFrame);

      return {
        latest: frame,
        frames: nextFrames,
        metricsBuffer: nextBuffer,
      };
    }),

  setScenario: (scenario) => set({ scenario }),

  setReplayMode: (replayMode) => set({ replayMode }),

  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),

  buildAnalyticsReport: () => {
    const state = get();
    const pr = presentReport(state.frames, "manual");
    if (!pr) return false;
    set({ analyticsReport: pr.report });
    return true;
  },

  clearAnalyticsReport: () => set({ analyticsReport: null }),
}));
