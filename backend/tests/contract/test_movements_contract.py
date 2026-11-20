"""GET /accounts/{id}/movements and GET /settlements/{id} (feature 012, contracts/movements-api.md)."""

from tests.conftest import auth_headers, participant_id
from tests.contract.test_settlements_create_contract import SETTLEMENT_FIELDS


def url(account) -> str:
    return f"/accounts/{account['_id']}/movements"


async def test_shape_of_a_page(
    client, create_user, create_account, create_expense, create_settlement
):
    owner = await create_user()
    account = await create_account(owner)
    await create_expense(account, owner, date="2026-11-10")
    await create_settlement(
        account,
        owner,
        participant_id(account, "Leandro"),
        participant_id(account, "Ana"),
        date="2026-11-11",
    )
    response = await client.get(url(account), headers=auth_headers(owner["_id"]))
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"items", "nextCursor", "total", "count"}
    kinds = [item["kind"] for item in body["items"]]
    assert kinds == ["settlement", "expense"]
    assert set(body["items"][0]) == {"kind", "settlement"}
    assert set(body["items"][0]["settlement"]) == SETTLEMENT_FIELDS
    assert set(body["items"][1]) == {"kind", "expense"}
    assert body["items"][1]["expense"]["title"] == "Cena"
    # The total counts expenses only (FR-007).
    assert (body["total"], body["count"]) == ("100.00", 1)


async def test_not_a_member_gets_404(client, create_user, create_account):
    owner, stranger = await create_user(), await create_user(email="stranger@mail.com")
    account = await create_account(owner)
    response = await client.get(url(account), headers=auth_headers(stranger["_id"]))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


async def test_invalid_cursor_and_limit_give_422(client, create_user, create_account):
    owner = await create_user()
    account = await create_account(owner)
    headers = auth_headers(owner["_id"])
    assert (await client.get(f"{url(account)}?cursor=nope", headers=headers)).status_code == 422
    assert (await client.get(f"{url(account)}?limit=0", headers=headers)).status_code == 422
    assert (await client.get(f"{url(account)}?limit=101", headers=headers)).status_code == 422


async def test_settlement_detail(client, create_user, create_account, create_settlement):
    owner = await create_user()
    account = await create_account(owner)
    settlement = await create_settlement(
        account, owner, participant_id(account, "Leandro"), participant_id(account, "Ana")
    )
    response = await client.get(
        f"/accounts/{account['_id']}/settlements/{settlement['_id']}",
        headers=auth_headers(owner["_id"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == SETTLEMENT_FIELDS
    assert body["recordedBy"] == {"id": participant_id(account, "Ana"), "name": "Ana"}


async def test_settlement_detail_404s(client, create_user, create_account, create_settlement):
    owner, stranger = await create_user(), await create_user(email="stranger@mail.com")
    account = await create_account(owner)
    leandro, ana = participant_id(account, "Leandro"), participant_id(account, "Ana")
    deleted = await create_settlement(account, owner, leandro, ana, deleted=True)
    alive = await create_settlement(account, owner, leandro, ana)
    base = f"/accounts/{account['_id']}/settlements"
    for path, user in (
        (f"{base}/{deleted['_id']}", owner),
        (f"{base}/000000000000000000000000", owner),
        (f"{base}/not-an-id", owner),
        (f"{base}/{alive['_id']}", stranger),
    ):
        response = await client.get(path, headers=auth_headers(user["_id"]))
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"
