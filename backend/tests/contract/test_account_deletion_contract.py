"""Contract of POST /users/me/deletion and /users/me/deletion/confirm (feature 015)."""

import pytest

from tests.conftest import auth_headers, last_code

REQUEST = "/users/me/deletion"
CONFIRM = "/users/me/deletion/confirm"


async def test_request_sends_a_code(client, create_user, email_outbox):
    user = await create_user(email="beto@mail.com")
    response = await client.post(REQUEST, headers=auth_headers(user["_id"]))
    assert response.status_code == 202
    assert response.json() == {"status": "accepted"}
    assert last_code(email_outbox, "beto@mail.com")
    assert email_outbox[-1].template == "delete_account"


async def test_request_is_rate_limited(client, create_user):
    user = await create_user(email="beto@mail.com")
    headers = auth_headers(user["_id"])
    assert (await client.post(REQUEST, headers=headers)).status_code == 202
    again = await client.post(REQUEST, headers=headers)
    assert again.status_code == 429
    assert again.json()["error"]["code"] == "rate_limited"
    assert again.json()["error"]["retryAfterSeconds"] >= 1


@pytest.mark.parametrize("path", [REQUEST, CONFIRM])
async def test_requires_a_session(client, path):
    response = await client.post(path, json={"code": "123456"})
    assert response.status_code == 401


async def test_confirm_deletes(client, create_user, email_outbox):
    user = await create_user(email="beto@mail.com")
    headers = auth_headers(user["_id"])
    await client.post(REQUEST, headers=headers)
    response = await client.post(
        CONFIRM, json={"code": last_code(email_outbox, "beto@mail.com")}, headers=headers
    )
    assert response.status_code == 204
    assert response.content == b""


async def test_confirm_with_a_wrong_code(client, create_user, email_outbox):
    user = await create_user(email="beto@mail.com")
    headers = auth_headers(user["_id"])
    await client.post(REQUEST, headers=headers)
    code = last_code(email_outbox, "beto@mail.com")
    wrong = "000000" if code != "000000" else "111111"
    response = await client.post(CONFIRM, json={"code": wrong}, headers=headers)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_code"


@pytest.mark.parametrize("body", [{}, {"code": "12345"}, {"code": "abcdef"}])
async def test_confirm_validation(client, create_user, body):
    user = await create_user(email="beto@mail.com")
    response = await client.post(CONFIRM, json=body, headers=auth_headers(user["_id"]))
    assert response.status_code == 422
