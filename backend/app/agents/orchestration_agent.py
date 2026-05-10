from __future__ import annotations


class CloudOrchestrationAgent:
    def __init__(self) -> None:
        self.deployment_status = "idle"
        self.policy_sync_status = "in-sync"
        self._cooldown = 0

    def tick(self, confidence: float) -> tuple[str, str]:
        if self._cooldown > 0:
            self._cooldown -= 1
            if self._cooldown == 0:
                self.deployment_status = "deployed"
                self.policy_sync_status = "in-sync"
            return self.deployment_status, self.policy_sync_status

        if confidence < 0.45:
            self.deployment_status = "retraining"
            self.policy_sync_status = "out-of-sync"
            self._cooldown = 20
        return self.deployment_status, self.policy_sync_status
