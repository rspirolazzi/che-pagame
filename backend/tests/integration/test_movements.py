"""Expenses and settlements together (feature 012, research R1 and R3)."""

from datetime import UTC, datetime, timedelta

from tests.conftest import auth_headers, participant_id


def url(account) -> str:
    return f"/accounts/{account['_id']}/movements"


async def test_merged_order_and_exact_pagination(
    client, create_user, create_account, create_expense, create_settlement
):
    owner = await create_user()
    account = await create_account(owner)
    leandro, ana = participant_id(account, "Leandro"), participant_id(account, "Ana")
    now = datetime.now(UTC)
    expected = []
    # Same dates on both sides, interleaved by creation time.
    for day in ("2026-11-01", "2026-11-02", "2026-11-03"):
        for offset in range(2):
            created = now + timedelta(seconds=len(expected))
            if offset == 0:
                doc = await create_expense(account, owner, date=day, created_at=created)
            else:
                doc = await create_settlement(
                    account, owner, leandro, ana, date=day, created_at=created
                )
            expected.append(str(doc["_id"]))
    await create_expense(account, owner, date="2026-11-04", deleted=True)
    await create_settlement(account, owner, leandro, ana, date="2026-11-04", deleted=True)
    expected.reverse()

    seen: list[str] = []
    cursor = None
    headers = auth_headers(owner["_id"])
    while True:
        query = f"?limit=2&cursor={cursor}" if cursor else "?limit=2"
        body = (await client.get(f"{url(account)}{query}", headers=headers)).json()
        for item in body["items"]:
            seen.append(item[item["kind"]]["id"])
        cursor = body["nextCursor"]
        if cursor is None:
            break
    assert seen == expected


async def test_recorded_by_is_null_once_nobody_is_linked(
    client, db, create_user, create_account, create_settlement
):
    owner, other = await create_user(), await create_user(email="other@mail.com")
    account = await create_account(owner)
    settlement = await create_settlement(
        account, other, participant_id(account, "Leandro"), participant_id(account, "Ana")
    )
    body = (await client.get(url(account), headers=auth_headers(owner["_id"]))).json()
    assert body["items"][0]["settlement"]["id"] == str(settlement["_id"])
    assert body["items"][0]["settlement"]["recordedBy"] is None


async def test_balances_do_not_change(
    client, create_user, create_account, create_expense, create_settlement
):
    owner = await create_user()
    account = await create_account(owner)
    await create_expense(account, owner, amount_minor=9000)
    await create_settlement(
        account,
        owner,
        participant_id(account, "Leandro"),
        participant_id(account, "Ana"),
        amount_minor=3000,
    )
    headers = auth_headers(owner["_id"])
    before = (await client.get(f"/accounts/{account['_id']}/balances", headers=headers)).json()
    await client.get(url(account), headers=headers)
    after = (await client.get(f"/accounts/{account['_id']}/balances", headers=headers)).json()
    assert before == after
    total = sum(int(e["amount"].replace(".", "")) for e in after["balances"])
    assert total == 0
