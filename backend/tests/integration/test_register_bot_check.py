"""Registration requires the anti-bot check in production (feature 017, US2)."""

import pytest

from app.core.errors import AppError
from app.services import turnstile_service


@pytest.fixture
def rejecting_check(monkeypatch):
    seen = []

    async def verify(token):
        seen.append(token)
        if token != "good-token":
            raise AppError(403, "bot_check_failed")

    monkeypatch.setattr(turnstile_service, "verify", verify)
    return seen


async def test_without_a_valid_token_nothing_is_sent(client, db, email_outbox, rejecting_check):
    for body in ({}, {"turnstileToken": "bad"}):
        response = await client.post(
            "/auth/register", json={"email": "ana@mail.com", "password": "secret-123", **body}
        )
        assert (response.status_code, response.json()["error"]["code"]) == (
            403,
            "bot_check_failed",
        )
    assert email_outbox == []
    assert await db.pending_registrations.count_documents({}) == 0


async def test_with_a_valid_token_registration_goes_on(client, db, email_outbox, rejecting_check):
    response = await client.post(
        "/auth/register",
        json={"email": "ana@mail.com", "password": "secret-123", "turnstileToken": "good-token"},
    )
    assert response.status_code == 202
    assert rejecting_check == ["good-token"]
    assert email_outbox[-1].template == "verify_email"


async def test_sign_in_never_asks_for_the_check(client, create_user, rejecting_check):
    await create_user(email="ana@mail.com")
    response = await client.post(
        "/auth/login", json={"email": "ana@mail.com", "password": "correct-password"}
    )
    assert response.status_code == 200
    assert rejecting_check == []
