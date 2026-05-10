import type { TelemetryFrame } from "@/types/telemetry";

export function toExportRows(frames: TelemetryFrame[]) {
  return frames.map((f) => ({
    t: f.ts,
    setpoint: f.setpoint,
    output_aac: f.output_aac,
    output_baseline: f.output_baseline,
    reward: f.reward,
    confidence: f.confidence,
  }));
}
