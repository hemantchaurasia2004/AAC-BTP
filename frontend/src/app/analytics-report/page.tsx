"use client";

import Link from "next/link";
import { useTelemetrySocket } from "@/hooks/useTelemetrySocket";
import { useTelemetryStore } from "@/store/useTelemetryStore";
import { AnalyticsReportView } from "@/components/analytics/AnalyticsReportModal";

export default function AnalyticsReportPage() {
  useTelemetrySocket();
  const report = useTelemetryStore((s) => s.analyticsReport);

  if (!report) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#020617] px-6 text-center text-slate-100">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">AAC intelligence</p>
        <h1 className="mt-4 max-w-xl text-3xl font-bold">No analytics snapshot yet</h1>
        <p className="mt-3 max-w-lg text-sm text-slate-400">
          On the dashboard, wait for telemetry to accumulate, then choose <strong className="text-slate-200">Open report</strong>{" "}
          to build this page from live data.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_24px_-4px_rgba(34,211,238,0.8)]"
          >
            Open dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 text-slate-100">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Analytics report</p>
        <Link href="/dashboard" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700">
          Back to dashboard
        </Link>
      </div>
      <AnalyticsReportView report={report} variant="page" />
    </div>
  );
}
