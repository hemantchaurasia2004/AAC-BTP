"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTelemetryStore } from "@/store/useTelemetryStore";

const MIN_FRAMES = 12;

export function CycleAnalyticsToolbar() {
  const router = useRouter();
  const connected = useTelemetryStore((s) => s.connected);
  const frameCount = useTelemetryStore((s) => s.frames.length);
  const buildAnalyticsReport = useTelemetryStore((s) => s.buildAnalyticsReport);

  function openReport() {
    if (!buildAnalyticsReport()) {
      window.alert(
        `Need at least ${MIN_FRAMES} telemetry samples (you have ${frameCount}). Stay on the dashboard until the live feed fills the buffer.`,
      );
      return;
    }
    router.push("/analytics-report");
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-3 text-slate-100 shadow-[0_0_24px_-6px_rgba(56,189,248,.35)] ring-1 ring-cyan-500/20">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/85">
        <BarChart3 className="h-4 w-4 text-cyan-300" aria-hidden />
        Performance report
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        Build a report from the current chart buffer when you are ready. No automatic pop-ups.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openReport}
          className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_-2px_rgba(34,211,238,.7)] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!connected || frameCount < MIN_FRAMES}
          title={
            connected
              ? "Snapshot live telemetry into the analytics dashboard."
              : "Connect WebSocket telemetry first."
          }
        >
          Open report
        </button>
        <Link
          href="/analytics-report"
          className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-cyan-500/60"
        >
          Last report route
        </Link>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Buffer: {frameCount} frames {connected ? "" : "(disconnected)"}
      </p>
    </div>
  );
}
