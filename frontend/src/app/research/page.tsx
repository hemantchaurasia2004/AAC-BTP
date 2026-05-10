import { ArchitectureDiagram } from "@/components/visuals/ArchitectureDiagram";

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-14 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Research Insights</h1>
        <p className="text-slate-600">
          AAC extends memory-based DD-PID with agentic contextualization, uncertainty
          awareness, and cloud-assisted policy updates.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Methodology</h2>
          <p className="mt-2 text-sm text-slate-600">
            Control law (simplified): u(t)=Kp*e(t)+Ki*∫e(t)dt+Kd*de/dt, with gains adapted
            by contextual policy and confidence-aware fallback.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Reward proxy: r = 1.4 - 2.4|e| - 0.35E - 1.5(1-c) + jitter_bonus.
          </p>
        </div>

        <ArchitectureDiagram />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Comparative Metrics (Simulated)</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th>AAC Benefit</th>
                <th>Estimated Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Jitter Reduction</td><td>25-45%</td></tr>
              <tr><td>Actuator Wear Reduction</td><td>15-30%</td></tr>
              <tr><td>Settling Proxy Reduction</td><td>18-35%</td></tr>
              <tr><td>Policy Adaptation Latency</td><td>{"< 500ms edge cycle"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
