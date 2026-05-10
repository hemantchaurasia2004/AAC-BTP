from app.models import Scenario
from app.simulation.scenarios import SCENARIO_CONFIGS


def test_all_scenarios_available():
    assert Scenario.NORMAL in SCENARIO_CONFIGS
    assert Scenario.UNSEEN_STATE_REGION in SCENARIO_CONFIGS
    assert len(SCENARIO_CONFIGS) == 6
