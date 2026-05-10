# Agentic Adaptive Control (AAC): Stabilized Hierarchical Adaptive PID for Industrially Credible Edge-Cloud Control

## Abstract

This work presents the final technical realization of Agentic Adaptive Control (AAC), an edge-cloud adaptive control framework designed to overcome two established weaknesses of CMAC-assisted data-driven PID systems: (i) steady-state parameter jitter leading to actuator wear, and (ii) contextual blindness under mixed operating objectives. While the initial architecture enabled adaptive behavior, telemetry-driven evaluation exposed critical instability modes, including gain explosion, excessive oscillation, overreactive adaptation, reward misalignment, and uncertainty-confidence inconsistency.  

To resolve these issues, we introduce a stabilization-complete control design that combines strict gain constraints, gain-rate limiting, exponential adaptation smoothing, adaptation cooldown scheduling, dynamic deadband-based jitter suppression, mode-switch hysteresis, reward realignment with industrial objectives, and uncertainty-coupled confidence decay. The plant and actuation model are also refined to enforce physical plausibility through saturation, lag, damping, and inertia-aware dynamics.  

The resulting AAC system transitions from a conceptually adaptive prototype to a research-valid and industrially believable control framework. The contribution is not merely improved tracking performance, but the creation of a measurable and auditable adaptive intelligence stack, including newly introduced diagnostics such as gain smoothness index, oscillation intensity index, adaptation efficiency, and stability recovery time.

---

## 1. Introduction

PID-based control remains the practical backbone of industrial process automation due to interpretability and implementation simplicity. However, static gain settings degrade under nonlinear, uncertain, and time-varying conditions. Data-driven and memory-based retrieval mechanisms such as CMAC offer computational efficiency for adaptive PID selection, especially under edge constraints.  

Despite this advantage, compressed memory retrieval alone does not guarantee operational robustness. In our AAC development cycle, a key finding was that adaptive capability without stabilization constraints can worsen control quality relative to a fixed baseline. This observation motivated a second-stage engineering objective: convert adaptation from "responsive" to "reliably stable."

This paper documents the final system-level technical resolution of that challenge.

---

## 2. Problem Statement

### 2.1 Initial System-Level Failures Observed

Telemetry and analytics revealed six dominant failure modes:

1. Unbounded internal gain trajectories (gain explosion risk),
2. High oscillation intensity and overshoot amplification,
3. Elevated actuator movement and wear accumulation,
4. Excessive retuning frequency (adaptation overreaction),
5. Reward objective favoring aggressive instability,
6. Confidence values not degrading during unstable operation.

### 2.2 Research Gap

Existing adaptive controller implementations often optimize performance metrics without enforcing sufficient control-theoretic and physical constraints on adaptation dynamics. This creates an "optimization-control mismatch" where learned behavior is mathematically active but physically unreliable.

### 2.3 Objective

Design and validate a stabilization-complete adaptive control framework in which:

- adaptation remains bounded and smooth,
- oscillation and wear are actively penalized,
- uncertainty and confidence are behaviorally coupled,
- fallback logic is triggered by operational reliability,
- analytics reflect true control quality, not apparent responsiveness.

---

## 3. System Architecture Overview

AAC follows a hierarchical edge-cloud organization:

- **Low-level edge agents**: control execution, jitter mitigation, confidence estimation.
- **Mid-level adaptation layer**: policy-based gain proposal and memory resolution logic.
- **High-level orchestration**: fallback governance and asynchronous cloud coordination.

The final architecture preserves low-latency edge execution while relocating slower supervisory adaptation decisions into bounded, scheduled logic.

---

## 4. Methodology

## 4.1 Stabilized Gain Adaptation

Adaptive gain updates are treated as constrained state transitions:

1. **Hard gain bounds** enforce admissible PID regions at all adaptation stages.
2. **Gain velocity limits** cap per-update gain increments to prevent abrupt retuning.
3. **Exponential smoothing** dampens candidate gain volatility.
4. **Adaptation cooldown** decouples control execution frequency from adaptation frequency.

This design prevents hidden gain divergence and reduces adaptation-induced oscillatory forcing.

## 4.2 Dynamic Deadband and Jitter Suppression

A fixed deadband is replaced by a dynamic deadband:

\[
\text{deadband}(t) = d_0 + \alpha \cdot \sigma_n(t) + \beta \cdot \mathcal{O}(t)
\]

where \(\sigma_n(t)\) is noise estimate and \(\mathcal{O}(t)\) is oscillation intensity.  

Steady-state gating requires simultaneous low error, low error derivative, and low oscillation. During this state:

- gain updates are frozen,
- micro-actuation changes are suppressed,
- integral accumulation can be frozen to avoid drift.

This directly addresses actuator wear accumulation from noise-driven micro-adjustments.

## 4.3 Control and Plant Realism Enforcement

To ensure industrial plausibility:

- control outputs are low-pass filtered,
- actuator commands are saturated and lagged,
- plant response includes damping and inertia-like second-order behavior,
- wear accumulates with both command effort and command mismatch.

These modifications prevent non-physical response artifacts and produce more credible transient/steady-state behavior.

## 4.4 Context Switching Governance

Mode transitions are stabilized via:

- minimum hold-time hysteresis,
- persistence window validation,
- confidence-gated switching.

This suppresses frequent mode flapping and improves supervisory coherence.

## 4.5 Reward Re-derivation

The reward function is reformulated as a multi-objective control utility:

\[
r_t = r_{\text{tracking}}
- p_{\text{overshoot}}
- p_{\text{oscillation}}
- p_{\text{wear}}
- p_{\Delta K}
- p_{\text{uncertainty}}
- p_{\text{switch}}
+ b_{\text{settling}}
+ b_{\text{smoothness}}
+ b_{\text{deadband}}
\]

This objective shifts learning pressure from aggressive correction toward stable, resource-aware adaptation.

## 4.6 Uncertainty-Confidence Coupling

Confidence is made instability-aware by coupling it to:

- normalized tracking error,
- oscillation intensity,
- gain variance,
- actuator wear burden,
- overshoot severity,
- sparse region penalties.

A rolling instability memory term introduces temporal consistency, enabling realistic confidence decay and improved fallback triggering fidelity.

---

## 5. Evaluation and Technical Validation Framework

Validation uses a twin-controller simulation structure:

- **AAC controller** (adaptive, stabilized),
- **baseline fixed PID controller** (reference comparator).

Performance interpretation is scenario-conditioned and based on both tracking and control-quality metrics.

### 5.1 Primary Metrics

- RMSE, MAE, overshoot, settling proxy,
- actuator travel and wear proxy,
- confidence behavior and fallback occupancy,
- latency and real-time stability.

### 5.2 Newly Introduced Adaptation Diagnostics

1. **Gain Smoothness Index** - adaptation trajectory regularity,
2. **Oscillation Intensity Index** - second-derivative output volatility,
3. **Adaptation Efficiency** - reward per gain-adjustment effort,
4. **Stability Recovery Time** - disturbance-to-recovery temporal profile.

These indices evaluate adaptation quality directly, not just output error.

---

## 6. Results Interpretation (Technical)

The final stabilized AAC framework demonstrates the following qualitative improvements relative to pre-stabilization behavior:

- Gain trajectories remain bounded and smoother under disturbances.
- Control oscillations are reduced through combined adaptation damping and output filtering.
- Actuator command jitter is reduced by dynamic deadband and micro-movement suppression.
- Mode transitions become less chaotic due to hysteresis and persistence checks.
- Confidence dynamics become informative and decline during unstable conditions.
- Fallback decisions are better aligned with real operational risk.

Most importantly, analytics now report both performance and adaptation health, making failures and improvements equally visible.

---

## 7. Contribution Relative to Midsem Work

The midsem phase established architecture and conceptual mechanisms (agentic hierarchy, context-aware retrieval, deadband concept, edge-cloud decomposition). The final phase delivers engineering closure by:

1. Adding mathematically enforced adaptation stability constraints,
2. Coupling intelligence to physical and actuator realism,
3. Realigning objective functions with industrial control priorities,
4. Operationalizing uncertainty into confidence and fallback behavior,
5. Extending analytics from endpoint metrics to adaptation-process diagnostics.

Thus, the project progressed from architecture proposal to technically grounded adaptive control realization.

---

## 8. Practical Significance

This work demonstrates that adaptive industrial control requires three simultaneous properties:

1. **Learning capability** (policy adaptation),
2. **Control-theoretic stability constraints** (bounded and damped adaptation),
3. **Operational truthfulness** (uncertainty-aware confidence and auditable metrics).

Without all three, adaptation may remain performant in isolated windows but unreliable in deployment settings.

---

## 9. Limitations

Current validation remains simulation-centered and does not yet include:

- hardware-in-the-loop latency/jitter injection,
- long-horizon actuator degradation studies with calibrated physical wear models,
- formal robustness certificates under bounded disturbances,
- plant-identification mismatch sensitivity quantification.

These are acknowledged as the next technical validation stage before field deployment claims.

---

## 10. Future Work

1. Hardware-in-the-loop and edge-device benchmark validation,
2. Formal uncertainty metrics beyond heuristic proxies (distributional calibration),
3. Disturbance taxonomy-aware adaptive scheduling,
4. Safety envelope synthesis with explicit control barrier constraints,
5. Online adaptation explainability for supervisory operators,
6. Multi-unit process generalization and transfer learning studies.

---

## 11. Conclusion

The final AAC implementation establishes that adaptive control quality is determined not by adaptation frequency or aggressiveness, but by constrained, uncertainty-aware, physically grounded adaptation design. By integrating gain bounding, adaptation damping, dynamic deadband logic, context hysteresis, reward realignment, and confidence-fallback coupling, the framework achieves a credible balance between tracking performance, stability, and actuator preservation.  

This transforms AAC from a promising agentic concept into a research-valid control system architecture suitable for rigorous industrial control studies.
