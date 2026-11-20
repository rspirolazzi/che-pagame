"""POST /contact and GET /public-config (feature 017, contracts/contact-and-bot-check-api.md)."""

import pytest

from app.core.errors import AppError
from app.services import contact_service, turnstile_service

VALID = {
    "name": "Ana",
    "email": "ana@mail.com",
    "message": "Hola, tengo una idea para ChePagame.",
    "language": "es",
    "consent": True,
}


async def test_accepted_outside_production_without_a_token(client, db):
    response = await client.post("/contact", json=VALID)
    assert response.status_code == 202
    assert response.content == b""
    # Nothing but the limit counters is written.
    assert await db.auth_attempts.count_documents({}) == 2


@pytest.mark.parametrize(
    "change",
    [
        {"email": "not-an-email"},
        {"name": ""},
        {"message": "corto"},
        {"message": "x" * 2001},
        {"consent": False},
        {"consent": None},
        {"language": "fr"},
    ],
)
async def test_invalid_fields_give_422(client, change):
    response = await client.post("/contact", json={**VALID, **change})
    assert response.status_code == 422


async def test_failed_bot_check_gives_403(client, monkeypatch):
    async def reject(token):
        raise AppError(403, "bot_check_failed")

    monkeypatch.setattr(turnstile_service, "verify", reject)
    response = await client.post("/contact", json=VALID)
    assert (response.status_code, response.json()["error"]["code"]) == (403, "bot_check_failed")


async def test_delivery_failure_gives_502_and_frees_the_limit(client, db, monkeypatch):
    async def fail(message):
        raise AppError(502, "contact_unavailable")

    monkeypatch.setattr(contact_service, "send", fail)
    response = await client.post("/contact", json=VALID)
    assert (response.status_code, response.json()["error"]["code"]) == (502, "contact_unavailable")
    assert await db.auth_attempts.count_documents({}) == 0


async def test_five_per_email_per_hour(client):
    for _ in range(5):
        assert (await client.post("/contact", json=VALID)).status_code == 202
    response = await client.post("/contact", json=VALID)
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "rate_limited"
    assert response.json()["error"]["retryAfterSeconds"] > 0


async def test_thirty_in_total_per_hour(client):
    for index in range(30):
        payload = {**VALID, "email": f"person{index}@mail.com"}
        assert (await client.post("/contact", json=payload)).status_code == 202
    response = await client.post("/contact", json={**VALID, "email": "other@mail.com"})
    assert response.status_code == 429


async def test_public_config_has_no_site_key_outside_production(client):
    response = await client.get("/public-config")
    assert response.status_code == 200
    assert response.json() == {"turnstileSiteKey": None}
    assert "max-age=300" in response.headers["cache-control"]


async def test_public_config_gives_the_site_key_in_production(client, monkeypatch):
    from app.api.v1 import public_config
    from tests.unit.test_contact_and_bot_check import PRODUCTION, settings

    monkeypatch.setattr(public_config, "get_settings", lambda: settings(**PRODUCTION))
    response = await client.get("/public-config")
    assert response.status_code == 200
    # Only the public key: no secret, phone or URL of the relay.
    assert response.json() == {"turnstileSiteKey": "site-key-value"}
