from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass

from app.agents.confidence_agent import ConfidenceAgent
from app.agents.contextualization_agent import ContextualizationAgent
from app.agents.jitter_agent import JitterMitigationAgent
from app.agents.orchestration_agent import CloudOrchestrationAgent
from app.agents.resolution_agent import ResolutionAgent
from app.control.cmac_memory import MultiResolutionCMAC
from app.control.fallback_controller import FallbackController
from app.control.pid import PIDController
from app.models import PIDGains, Scenario, TelemetryFrame
from app.rl.cloud_retrainer import CloudRetrainer
from app.rl.policy_manager import PolicyManager
from app.rl.reward_model import compute_reward
from app.services.telemetry_history import TelemetryHistory
from app.simulation.plant import NonlinearPlant
from app.simulation.scenarios import SCENARIO_CONFIGS
from app.ws.connection_manager import ConnectionManager


@dataclass
class RuntimeConfig:
    scenario: Scenario = Scenario.NORMAL
    tick_ms: int = 200


class SimulationRuntime:
    def __init__(self) -> None:
        self.config = RuntimeConfig()
        self.manager = ConnectionManager()
        self.history = TelemetryHistory()

        self.plant_aac = NonlinearPlant()
        self.plant_baseline = NonlinearPlant()
        self.cmac = MultiResolutionCMAC()
        self.fallback = FallbackController()
        self.policy = PolicyManager()
        self.retrainer = CloudRetrainer()
        self.ctx_agent = ContextualizationAgent()
        self.jitter_agent = JitterMitigationAgent()
        self.conf_agent = ConfidenceAgent()
        self.resolution_agent = ResolutionAgent()
        self.cloud_agent = CloudOrchestrationAgent()
        self.pid_aac = PIDController(PIDGains(kp=1.1, ki=0.4, kd=0.1))
        self.pid_baseline = PIDController(PIDGains(kp=1.0, ki=0.35, kd=0.08))
        self._task: asyncio.Task | None = None
        self._start = time.time()
        self._settling_proxy = 0.0

    def set_scenario(self, scenario: Scenario) -> None:
        self.config.scenario = scenario

    def set_tick_ms(self, tick_ms: int) -> None:
        self.config.tick_ms = max(100, min(500, tick_ms))

    async def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._run())

    async def _run(self) -> None:
        while True:
            t0 = time.time()
            dt = self.config.tick_ms / 1000.0
            cfg = SCENARIO_CONFIGS[self.config.scenario]
            setpoint = cfg.setpoint

            base = self.cmac.retrieve(self.plant_aac.state, setpoint)
            confidence = self.conf_agent.score(self.plant_aac.state, setpoint, cfg.unseen_zone_boost)
            tracking_error = setpoint - self.plant_aac.state
            control_energy = abs(self.pid_aac.state.prev_error)
            mode = self.ctx_agent.detect_mode(tracking_error, confidence, control_energy)
            resolution = self.resolution_agent.adjust(confidence, tracking_error)
            self.cmac.set_resolution(resolution)

            adapted = self.policy.propose_gains(mode, base, confidence)
            severe = self.plant_aac.state > 1.05 or confidence < 0.25
            fallback_gains = self.fallback.select(confidence, severe)
            gains = adapted if self.fallback.level == 0 else fallback_gains
            self.fallback.update_stable(gains, confidence)
            self.pid_aac.update_gains(gains)
            self.cmac.write(self.plant_aac.state, setpoint, gains)

            jitter_freeze = self.jitter_agent.evaluate(tracking_error, cfg.noise_std)
            u_aac = 0.0 if jitter_freeze else self.pid_aac.step(setpoint, self.plant_aac.state, dt)
            u_base = self.pid_baseline.step(setpoint, self.plant_baseline.state, dt)
            y_aac = self.plant_aac.step(u_aac, cfg, dt)
            y_base = self.plant_baseline.step(u_base, cfg, dt)

            retrained = self.retrainer.maybe_retrain(confidence, self.fallback.last_stable)
            if self.retrainer.pending:
                self.cmac.write(self.plant_aac.state, setpoint, retrained)

            deployment_status, policy_sync_status = self.cloud_agent.tick(confidence)
            reward = compute_reward(tracking_error, abs(u_aac), confidence, jitter_freeze)
            self._settling_proxy = 0.92 * self._settling_proxy + 0.08 * abs(tracking_error)
            latency_ms = (time.time() - t0) * 1000.0

            frame = TelemetryFrame(
                ts=time.time() - self._start,
                dt_ms=self.config.tick_ms,
                scenario=self.config.scenario,
                mode=mode,
                setpoint=setpoint,
                output_aac=y_aac,
                output_baseline=y_base,
                control_aac=u_aac,
                control_baseline=u_base,
                kp=gains.kp,
                ki=gains.ki,
                kd=gains.kd,
                confidence=confidence,
                reward=reward,
                latency_ms=latency_ms,
                jitter_metric=cfg.noise_std,
                jitter_freeze_active=jitter_freeze,
                resolution_level=resolution,
                fallback_level=self.fallback.level,
                tracking_error=abs(tracking_error),
                overshoot=max(0.0, y_aac - setpoint),
                settling_time_proxy=self._settling_proxy,
                control_energy=abs(u_aac),
                actuator_wear_index=self.plant_aac.actuator_wear,
                system_health=max(0.0, min(1.0, 0.8 * confidence + 0.2 * (1 - self.plant_aac.actuator_wear))),
                tank_level=self.plant_aac.tank_level,
                flow_rate=self.plant_aac.flow_rate,
                valve_position=max(0.0, min(1.0, (u_aac + 1) / 2)),
                pressure=self.plant_aac.pressure,
                deployment_status=deployment_status,
                policy_sync_status=policy_sync_status,
                agent_logs=[
                    f"[EDGE] mode={mode.value}",
                    f"[EDGE] fallback={self.fallback.level}",
                    f"[EDGE] confidence={confidence:.2f}",
                    f"[CLOUD] deploy={deployment_status}",
                ],
            )
            payload = frame.model_dump(mode="json")
            self.history.push(payload)
            await self.manager.broadcast(payload)
            await asyncio.sleep(dt)
