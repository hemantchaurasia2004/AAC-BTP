export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-14 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-700">BTP Research Platform</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Agentic Adaptive Control (AAC)
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Augmenting cerebellar memory-based DD-PID using hierarchical reinforcement
            learning, uncertainty awareness, and edge-cloud orchestration for
            autonomous industrial control.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded bg-blue-600 px-4 py-2 text-sm text-white" href="/dashboard">
              Open Live Dashboard
            </a>
            <a className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700" href="/research">
              View Research Insights
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Problem</h2>
            <p className="mt-2 text-sm text-slate-600">
              Traditional CMAC-DDPID controllers show jitter, context blindness, and low
              uncertainty awareness in dynamic cyber-physical environments.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Solution</h2>
            <p className="mt-2 text-sm text-slate-600">
              AAC combines contextual agents, adaptive resolution memory, and cloud policy
              optimization with safe fallback pipelines.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Features</h2>
            <p className="mt-2 text-sm text-slate-600">
              HRL-inspired adaptation, uncertainty quantification, edge-cloud deployment
              sync, adaptive deadband, and live telemetry visualization.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
