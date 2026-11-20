"""The shared split cases (test-vectors/split-equal.json) match split_equal (feature 013, R3).

The web and the App run the same file against their own copy of the rule, so the three can never
disagree on a share.
"""

import json
from pathlib import Path

import pytest

from app.core.money import format_amount, parse_amount, split_equal

CASES = json.loads(
    (Path(__file__).resolve().parents[3] / "test-vectors" / "split-equal.json").read_text(
        encoding="utf-8"
    )
)


@pytest.mark.parametrize("case", CASES, ids=[case["name"] for case in CASES])
def test_case_matches_the_server_rule(case):
    minor = parse_amount(case["amount"], case["currency"])
    shares = split_equal(minor, case["selected"], case["accountOrder"])
    formatted = {pid: format_amount(value, case["currency"]) for pid, value in shares.items()}
    assert formatted == case["expected"]
    assert sum(shares.values()) == minor
