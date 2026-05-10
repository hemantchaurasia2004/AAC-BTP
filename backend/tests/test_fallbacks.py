from app.control.fallback_controller import FallbackController
from app.models import PIDGains


def test_fallback_levels_progress():
    fb = FallbackController()
    fb.update_stable(PIDGains(kp=1.2, ki=0.5, kd=0.1), confidence=0.9)
    _ = fb.select(confidence=0.55, severe=False)
    assert fb.level == 1
    _ = fb.select(confidence=0.4, severe=False)
    assert fb.level == 2
    _ = fb.select(confidence=0.2, severe=True)
    assert fb.level == 3
