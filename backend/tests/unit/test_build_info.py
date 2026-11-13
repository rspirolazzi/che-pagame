import pytest

from app.core.build_info import get_build_info

VARIABLES = ("APP_VERSION", "BUILD_NUMBER", "BUILD_DATE", "RELEASE_TAG", "GIT_SHA")


@pytest.fixture(autouse=True)
def _clear_build_env(monkeypatch):
    for name in VARIABLES:
        monkeypatch.delenv(name, raising=False)


def test_reads_the_build_variables(monkeypatch):
    monkeypatch.setenv("APP_VERSION", "0.1.0")
    monkeypatch.setenv("BUILD_NUMBER", "42")
    monkeypatch.setenv("BUILD_DATE", "2026-11-13T18:40:00Z")
    monkeypatch.setenv("RELEASE_TAG", "main-42")
    monkeypatch.setenv("GIT_SHA", "397655e")
    assert get_build_info() == {
        "version": "0.1.0",
        "buildNumber": "42",
        "buildDate": "2026-11-13T18:40:00Z",
        "releaseTag": "main-42",
        "commit": "397655e",
    }


def test_without_variables_reports_dev():
    assert get_build_info() == {
        "version": "dev",
        "buildNumber": None,
        "buildDate": None,
        "releaseTag": None,
        "commit": None,
    }


@pytest.mark.parametrize(
    ("name", "value", "field"),
    [
        ("GIT_SHA", "not-a-sha", "commit"),
        ("GIT_SHA", "abc12", "commit"),
        ("GIT_SHA", "<script>", "commit"),
        ("BUILD_NUMBER", "42a", "buildNumber"),
        ("RELEASE_TAG", "release-42", "releaseTag"),
        ("BUILD_DATE", "13/11/2026", "buildDate"),
    ],
)
def test_invalid_values_are_treated_as_missing(monkeypatch, name, value, field):
    monkeypatch.setenv(name, value)
    assert get_build_info()[field] is None


def test_invalid_version_falls_back_to_dev(monkeypatch):
    monkeypatch.setenv("APP_VERSION", "1.0 <b>")
    assert get_build_info()["version"] == "dev"
