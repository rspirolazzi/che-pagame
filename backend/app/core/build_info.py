"""Build information baked into the production image (feature 009, research R5).

The deploy workflow passes APP_VERSION, BUILD_NUMBER, BUILD_DATE, RELEASE_TAG and GIT_SHA as
build args that end up as environment variables. Values that do not match their expected format
are reported as missing, so arbitrary text is never echoed back.
"""

import os
import re

_PATTERNS: dict[str, tuple[str, re.Pattern[str]]] = {
    "buildNumber": ("BUILD_NUMBER", re.compile(r"\d{1,10}")),
    "buildDate": ("BUILD_DATE", re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z")),
    "releaseTag": ("RELEASE_TAG", re.compile(r"main-\d{1,10}")),
    "commit": ("GIT_SHA", re.compile(r"[0-9a-f]{7,40}")),
}
_VERSION = re.compile(r"\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?")


def _read(name: str, pattern: re.Pattern[str]) -> str | None:
    value = os.environ.get(name, "").strip()
    return value if pattern.fullmatch(value) else None


def get_build_info() -> dict[str, str | None]:
    info: dict[str, str | None] = {"version": _read("APP_VERSION", _VERSION) or "dev"}
    for field, (name, pattern) in _PATTERNS.items():
        info[field] = _read(name, pattern)
    return info
