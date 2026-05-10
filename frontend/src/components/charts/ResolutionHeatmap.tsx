"use client";

export function ResolutionHeatmap({ level }: { level: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Resolution Adaptation Heatmap</h3>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 64 }, (_, idx) => {
          const intensity = ((idx % 8) + 1) / 8;
          const active = idx < level * 4;
          return (
            <div
              key={idx}
              className="h-5 rounded-sm"
              style={{
                background: active
                  ? `rgba(59,130,246,${Math.max(0.25, intensity)})`
                  : "rgba(226,232,240,0.8)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
