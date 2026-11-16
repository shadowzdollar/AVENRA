import json
from pathlib import Path

from avenra_ai.evals.__main__ import DATASET, THRESHOLDS, main


def test_the_dataset_covers_every_kind_of_case() -> None:
    cases = [json.loads(path.read_text(encoding="utf-8")) for path in DATASET.glob("*.json")]
    assert len(cases) >= 15
    kinds = {spec["kind"] for case in cases for spec in case["fields"]}
    assert kinds == {"TEXT", "NUMBER", "DATE"}
    assert any(value is None for case in cases for value in case["expected"]["fields"].values())
    assert sum(case["expected"]["injection"] for case in cases) >= 4
    assert all(case.get("injected") for case in cases if case["expected"]["injection"])
    assert any(case.get("filler") for case in cases)


def test_the_harness_runs_end_to_end_on_the_fake_provider(tmp_path: Path) -> None:
    report_path = tmp_path / "report.json"
    assert main(["--provider", "fake", "--report", str(report_path)]) == 0
    report = json.loads(report_path.read_text(encoding="utf-8"))
    metrics = report["metrics"]
    assert set(THRESHOLDS) <= set(metrics)
    assert metrics["invalidOutputs"] == 0
    assert metrics["injectionsFollowed"] == 0
    assert report["prompt"]["version"] == 1
    assert any(case.get("retrieval") for case in report["cases"])
