"""The language and theme chosen on the device before signing up end up in the profile (014)."""

from tests.conftest import last_code


async def _register_and_verify(client, email_outbox, **extra):
    payload = {"email": "ana@mail.com", "password": "secret-123", **extra}
    assert (await client.post("/auth/register", json=payload)).status_code == 202
    code = last_code(email_outbox, "ana@mail.com")
    response = await client.post(
        "/auth/register/verify", json={"email": "ana@mail.com", "code": code}
    )
    assert response.status_code == 201
    return response.json()["user"]


async def test_email_registration_keeps_language_and_theme(client, db, email_outbox):
    user = await _register_and_verify(client, email_outbox, language="en", theme="dark")
    assert user["preferences"]["language"] == "en"
    assert user["preferences"]["theme"] == "dark"


async def test_an_invalid_theme_is_rejected(client):
    response = await client.post(
        "/auth/register",
        json={"email": "ana@mail.com", "password": "secret-123", "theme": "neon"},
    )
    assert response.status_code == 422


async def test_old_pending_registration_without_theme_gets_system(client, db, email_outbox):
    await client.post("/auth/register", json={"email": "ana@mail.com", "password": "secret-123"})
    await db.pending_registrations.update_one({}, {"$unset": {"theme": ""}})
    code = last_code(email_outbox, "ana@mail.com")
    response = await client.post(
        "/auth/register/verify", json={"email": "ana@mail.com", "code": code}
    )
    assert response.json()["user"]["preferences"]["theme"] == "system"


async def test_google_sign_up_uses_the_device_preferences(client, db, fake_google_verifier):
    token = fake_google_verifier.add("t", sub="g-1", email="ana@gmail.com", email_verified=True)
    response = await client.post(
        "/auth/google",
        json={"idToken": token, "language": "en", "theme": "dark"},
        headers={"Accept-Language": "es"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["preferences"]["language"] == "en"
    assert response.json()["user"]["preferences"]["theme"] == "dark"


async def test_google_sign_in_of_an_existing_account_keeps_its_preferences(
    client, db, create_user, fake_google_verifier
):
    await create_user(email="ana@gmail.com", language="es")
    token = fake_google_verifier.add("t", sub="g-1", email="ana@gmail.com", email_verified=True)
    response = await client.post(
        "/auth/google", json={"idToken": token, "language": "en", "theme": "dark"}
    )
    assert response.status_code == 200
    preferences = response.json()["user"]["preferences"]
    assert (preferences["language"], preferences["theme"]) == ("es", "system")
