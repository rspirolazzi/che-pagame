"""Settings, Turnstile and CallMeBot of feature 017, without credentials or network calls."""

import logging
from datetime import UTC, datetime

import pytest

from app.core.config import Settings
from app.core.errors import AppError
from app.services import contact_service, turnstile_service

BASE = {
    "mongodb_uri": "mongodb://localhost:27017",
    "jwt_secret": "x" * 40,
    "code_hash_secret": "y" * 40,
    "email_delivery": "console",
}
PRODUCTION = {
    **BASE,
    "environment": "production",
    "email_delivery": "resend",
    "resend_api_key": "re_test",
    "email_from": "ChePagame <no-reply@example.com>",
    "callmebot_url": "https://api.callmebot.example/whatsapp.php",
    "callmebot_phone": "phone-value",
    "callmebot_apikey": "apikey-value",
    "cloudflare_turnstile_secret_key": "secret-value",
    "cloudflare_turnstile_site_key": "site-key-value",
}


def settings(**overrides) -> Settings:
    return Settings(_env_file=None, **{**BASE, **overrides})  # type: ignore[call-arg]


# --- Settings (FR-007) --------------------------------------------------------------------------


def test_development_needs_no_credentials():
    assert settings(environment="development").bot_check_enabled is False


def test_environment_is_case_insensitive():
    current = Settings(_env_file=None, **{**PRODUCTION, "environment": "PRODUCTION"})  # type: ignore[call-arg]
    assert current.environment == "production"
    assert current.bot_check_enabled is True


@pytest.mark.parametrize(
    ("field", "name"),
    [
        ("callmebot_url", "CALLMEBOT_URL"),
        ("callmebot_phone", "CALLMEBOT_PHONE"),
        ("callmebot_apikey", "CALLMEBOT_APIKEY"),
        ("cloudflare_turnstile_secret_key", "CLOUDFLARE_TURNSTILE_SECRET_KEY"),
        ("cloudflare_turnstile_site_key", "CLOUDFLARE_TURNSTILE_SITE_KEY"),
    ],
)
def test_production_names_the_missing_setting_without_values(field, name):
    with pytest.raises(ValueError) as raised:
        Settings(_env_file=None, **{**PRODUCTION, field: ""})  # type: ignore[call-arg]
    message = str(raised.value)
    assert name in message
    for value in ("apikey-value", "secret-value", "phone-value", "site-key-value"):
        assert value not in message


def test_production_requires_https_for_callmebot():
    with pytest.raises(ValueError):
        Settings(_env_file=None, **{**PRODUCTION, "callmebot_url": "http://x"})  # type: ignore[call-arg]


# --- Turnstile (R2) -----------------------------------------------------------------------------


@pytest.fixture
def production(monkeypatch):
    current = Settings(_env_file=None, **PRODUCTION)  # type: ignore[call-arg]
    monkeypatch.setattr(turnstile_service, "get_settings", lambda: current)
    monkeypatch.setattr(contact_service, "get_settings", lambda: current)
    return current


async def test_outside_production_the_check_passes_without_calling(monkeypatch):
    called = []
    monkeypatch.setattr(turnstile_service, "_post", lambda *a: called.append(a))
    monkeypatch.setattr(turnstile_service, "get_settings", lambda: settings(environment="test"))
    await turnstile_service.verify(None)
    assert called == []


async def test_a_valid_token_passes(production, monkeypatch):
    sent = {}

    def fake_post(url, form):
        sent.update(form)
        return {"success": True}

    monkeypatch.setattr(turnstile_service, "_post", fake_post)
    await turnstile_service.verify("token-1")
    assert sent == {"secret": "secret-value", "response": "token-1"}


@pytest.mark.parametrize(
    "answer", [{"success": False}, {"success": False, "error-codes": ["timeout-or-duplicate"]}]
)
async def test_rejected_or_reused_tokens_fail(production, monkeypatch, answer):
    monkeypatch.setattr(turnstile_service, "_post", lambda url, form: answer)
    with pytest.raises(AppError) as raised:
        await turnstile_service.verify("token-1")
    assert (raised.value.status_code, raised.value.code) == (403, "bot_check_failed")


async def test_missing_token_or_network_error_fail_closed(production, monkeypatch):
    with pytest.raises(AppError):
        await turnstile_service.verify(None)

    def broken(url, form):
        raise TimeoutError

    monkeypatch.setattr(turnstile_service, "_post", broken)
    with pytest.raises(AppError):
        await turnstile_service.verify("token-1")


# --- CallMeBot (R3) -----------------------------------------------------------------------------

MESSAGE = contact_service.ContactMessage(
    name="Ana", email="ana@mail.com", message="Hola, una idea…", language="es", client="web"
)


def test_text_has_every_field_and_is_cut():
    text = contact_service.build_text(MESSAGE, datetime(2026, 11, 20, 12, 0, tzinfo=UTC))
    for part in ("Ana", "ana@mail.com", "es", "web", "2026-11-20 12:00 UTC", "Hola, una idea…"):
        assert part in text
    long = contact_service.ContactMessage(**{**MESSAGE.__dict__, "message": "x" * 5000})
    assert len(contact_service.build_text(long)) == contact_service.MAX_TEXT_LENGTH


async def test_production_sends_to_callmebot(production, monkeypatch):
    urls = []
    monkeypatch.setattr(contact_service, "_get", lambda url: urls.append(url) or 200)
    await contact_service.send(MESSAGE)
    assert urls[0].startswith("https://api.callmebot.example/whatsapp.php?")
    for part in ("phone=phone-value", "apikey=apikey-value", "text=ChePagame"):
        assert part in urls[0]


@pytest.mark.parametrize("outcome", [500, TimeoutError()])
async def test_delivery_failures_give_502_without_leaking(production, monkeypatch, caplog, outcome):
    def fake_get(url):
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(contact_service, "_get", fake_get)
    caplog.set_level(logging.INFO, logger="app")
    with pytest.raises(AppError) as raised:
        await contact_service.send(MESSAGE)
    assert (raised.value.status_code, raised.value.code) == (502, "contact_unavailable")
    logs = caplog.text
    for secret in ("apikey-value", "phone-value", "ana@mail.com", "Hola", "Ana"):
        assert secret not in logs


async def test_outside_production_only_counts_the_message(monkeypatch, caplog):
    monkeypatch.setattr(contact_service, "get_settings", lambda: settings(environment="test"))
    monkeypatch.setattr(contact_service, "_get", lambda url: pytest.fail("must not send"))
    caplog.set_level(logging.INFO, logger="app")
    await contact_service.send(MESSAGE)
    records = [r for r in caplog.records if r.name.startswith("app")]
    assert records and records[-1].length == len(MESSAGE.message)  # type: ignore[attr-defined]
    assert "ana@mail.com" not in caplog.text and "Hola" not in caplog.text
