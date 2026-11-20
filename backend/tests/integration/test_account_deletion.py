"""Deleting my user account (feature 015): US1 (me) and US2 (the accounts I share)."""

import asyncio
from datetime import UTC, datetime, timedelta

import pytest

from app.core.errors import AppError
from app.repositories import users
from app.services import account_deletion_service, token_service
from tests.conftest import actions, auth_headers, last_code, link, participant_id

REQUEST = "/users/me/deletion"
CONFIRM = "/users/me/deletion/confirm"


async def _delete(client, user, outbox) -> None:
    headers = auth_headers(user["_id"])
    assert (await client.post(REQUEST, headers=headers)).status_code == 202
    code = last_code(outbox, user["email"])
    response = await client.post(CONFIRM, json={"code": code}, headers=headers)
    assert response.status_code == 204, response.text


async def _balances(client, account, user) -> dict[str, str]:
    response = await client.get(
        f"/accounts/{account['_id']}/balances", headers=auth_headers(user["_id"])
    )
    assert response.status_code == 200
    return {e["participant"]["id"]: e["amount"] for e in response.json()["balances"]}


# --- US1: me -------------------------------------------------------------------------------------


async def test_the_user_and_its_sessions_disappear(client, db, create_user, email_outbox):
    beto = await create_user(email="beto@mail.com", first_name="Beto", last_name="Gómez")
    pair = await token_service.issue_token_pair(beto["_id"], "mobile")
    await db.users.update_one({"_id": beto["_id"]}, {"$set": {"pendingEmail": "nuevo@mail.com"}})
    await db.verification_codes.insert_one(
        {"email": "nuevo@mail.com", "purpose": "change_email", "consumedAt": None}
    )
    await db.pending_registrations.insert_one({"email": "beto@mail.com"})

    await _delete(client, beto, email_outbox)

    assert await db.users.find_one({"_id": beto["_id"]}) is None
    assert await db.refresh_tokens.count_documents({"userId": beto["_id"]}) == 0
    for email in ("beto@mail.com", "nuevo@mail.com"):
        assert await db.verification_codes.count_documents({"email": email}) == 0
        assert await db.pending_registrations.count_documents({"email": email}) == 0
    me = await client.get("/users/me", headers=auth_headers(beto["_id"]))
    assert me.status_code == 401
    refresh = await client.post("/auth/refresh", json={"refreshToken": pair.refresh_token})
    assert refresh.status_code == 401

    entry = await db.audit_logs.find_one({"action": "user.deleted"})
    assert entry["actorUserId"] == beto["_id"] and entry["entityId"] == beto["_id"]
    assert entry["changes"] == {}
    assert "beto@mail.com" not in str(entry) and "Beto" not in str(entry)


async def test_a_wrong_code_changes_nothing(client, db, create_user, email_outbox):
    beto = await create_user(email="beto@mail.com")
    headers = auth_headers(beto["_id"])
    await client.post(REQUEST, headers=headers)
    code = last_code(email_outbox, "beto@mail.com")
    wrong = "000000" if code != "000000" else "111111"
    assert (await client.post(CONFIRM, json={"code": wrong}, headers=headers)).status_code == 400
    assert await db.users.find_one({"_id": beto["_id"]}) is not None
    assert (await client.post(CONFIRM, json={"code": code}, headers=headers)).status_code == 204


async def test_a_failure_keeps_the_user_and_the_code(
    client, db, create_user, email_outbox, monkeypatch
):
    beto = await create_user(email="beto@mail.com")
    await client.post(REQUEST, headers=auth_headers(beto["_id"]))
    code = last_code(email_outbox, "beto@mail.com")

    async def _boom(*_args, **_kwargs):
        raise RuntimeError("simulated failure")

    monkeypatch.setattr(users, "delete", _boom)
    with pytest.raises(RuntimeError):
        await account_deletion_service.confirm_deletion(beto["_id"], code, "web")
    assert await db.users.find_one({"_id": beto["_id"]}) is not None
    assert await db.audit_logs.count_documents({"action": "user.deleted"}) == 0

    monkeypatch.undo()
    await account_deletion_service.confirm_deletion(beto["_id"], code, "web")
    assert await db.users.find_one({"_id": beto["_id"]}) is None


async def test_a_google_only_user_gets_the_code_by_email(client, db, create_user, email_outbox):
    caro = await create_user(email="caro@gmail.com", password=None, google_subject="google-caro")
    await _delete(client, caro, email_outbox)
    assert await db.users.find_one({"googleSubject": "google-caro"}) is None


async def test_the_email_can_register_again_as_a_new_user(
    client, db, create_user, create_account, email_outbox
):
    beto = await create_user(email="beto@mail.com")
    await create_account(beto, name="Solo Beto")
    await _delete(client, beto, email_outbox)

    again = await create_user(email="beto@mail.com")
    assert again["_id"] != beto["_id"]
    listed = await client.get("/accounts", headers=auth_headers(again["_id"]))
    assert listed.json() == []


async def test_logs_never_show_the_email_or_name(client, create_user, email_outbox, caplog):
    """FR-014: application logs (INFO and up, as in production) only carry the user id."""
    beto = await create_user(email="beto@mail.com", first_name="Bettino")
    caplog.set_level("INFO")
    await _delete(client, beto, email_outbox)
    app_logs = [r.getMessage() for r in caplog.records if r.name.startswith("app.")]
    assert any("deletion" in message.lower() for message in app_logs)
    for message in app_logs:
        assert "beto@mail.com" not in message and "Bettino" not in message


async def test_no_trace_of_email_or_profile_name_is_left(
    client, db, create_user, create_account, email_outbox
):
    """SC-002: neither the email nor the profile name appear in any collection."""
    beto = await create_user(email="beto@mail.com", first_name="Bettino", last_name="Zapata")
    ana = await create_user(email="ana@mail.com")
    headers = auth_headers(beto["_id"])
    await client.patch("/users/me", json={"firstName": "Bettino"}, headers=headers)
    await client.patch("/users/me", json={"lastName": "Zapata"}, headers=headers)
    shared = await create_account(ana, others=("Bettino",))
    await link(db, shared, "Bettino", beto)

    await _delete(client, beto, email_outbox)

    for name in await db.list_collection_names():
        async for doc in db[name].find({}):
            text = str(doc)
            for secret in ("beto@mail.com", "Bettino", "Zapata"):
                assert secret not in text, f"{secret} left in {name}"


# --- US2: the accounts I share ---------------------------------------------------------------------


async def test_shared_account_keeps_expenses_and_balances(
    client, db, create_user, create_account, create_expense, create_settlement, email_outbox
):
    ana = await create_user(email="ana@mail.com")
    beto = await create_user(email="beto@mail.com")
    account = await create_account(ana, others=("Beto", "Javier"))
    beto_pid = await link(db, account, "Beto", beto)
    await create_expense(account, beto, title="Nafta", amount_minor=30000, paid_by=beto_pid)
    await create_expense(account, ana, title="Cena", amount_minor=12000)
    await create_settlement(account, beto, beto_pid, participant_id(account, "Ana"), 500)
    before = await _balances(client, account, ana)

    await _delete(client, beto, email_outbox)

    assert await _balances(client, account, ana) == before
    doc = await db.accounts.find_one({"_id": account["_id"]})
    participant = next(p for p in doc["participants"] if p["id"] == beto_pid)
    assert participant["userId"] is None
    assert participant["anonymizedAt"] is not None
    assert participant["nameKey"] == f"\u0000deleted:{beto_pid}"
    assert participant["removedAt"] is None
    assert doc["isDeleted"] is False and doc["ownerId"] == ana["_id"]

    for language, expected in (("es", "Usuario eliminado"), ("en", "Deleted user")):
        response = await client.get(
            f"/accounts/{account['_id']}",
            headers={**auth_headers(ana["_id"]), "Accept-Language": language},
        )
        shown = next(p for p in response.json()["participants"] if p["id"] == beto_pid)
        assert shown["name"] == expected
        assert shown["isAnonymized"] is True and shown["isLinked"] is False
    assert "account.member_deleted" in await actions(db, account["_id"])


async def test_owner_role_moves_to_the_member_who_joined_first(
    client, db, create_user, create_account, email_outbox
):
    caro = await create_user(email="caro@mail.com")
    ana = await create_user(email="ana@mail.com")
    leo = await create_user(email="leo@mail.com")
    account = await create_account(caro, owner_name="Caro", others=("Ana", "Leo"))
    ana_pid = await link(db, account, "Ana", ana)
    leo_pid = await link(db, account, "Leo", leo)
    now = datetime.now(UTC)
    await db.accounts.update_one(
        {"_id": account["_id"]},
        {
            "$set": {
                "participants.$[a].linkedAt": now - timedelta(days=2),
                "participants.$[l].linkedAt": now - timedelta(days=5),
            }
        },
        array_filters=[{"a.id": ana_pid}, {"l.id": leo_pid}],
    )

    await _delete(client, caro, email_outbox)

    doc = await db.accounts.find_one({"_id": account["_id"]})
    assert doc["ownerId"] == leo["_id"]
    seen = await client.get(f"/accounts/{account['_id']}", headers=auth_headers(leo["_id"]))
    assert seen.json()["isOwner"] is True


async def test_accounts_without_other_registered_members_are_deleted(
    client, db, create_user, create_account, email_outbox
):
    beto = await create_user(email="beto@mail.com")
    solo = await create_account(beto, name="Solo Beto", others=("Javier", "Leandro"))
    closed = await create_account(beto, name="Cerrada", closed=True)

    await _delete(client, beto, email_outbox)

    for account in (solo, closed):
        doc = await db.accounts.find_one({"_id": account["_id"]})
        assert doc["isDeleted"] is True and doc["deletedAt"] is not None
        mine = doc["participants"][0]
        assert mine["userId"] is None and mine["anonymizedAt"] is not None
    other = await create_user(email="otro@mail.com")
    preview = await client.get(
        f"/invitations/{solo['inviteCode']}", headers=auth_headers(other["_id"])
    )
    assert preview.status_code == 404


async def test_closed_shared_accounts_are_processed_too(
    client, db, create_user, create_account, email_outbox
):
    ana = await create_user(email="ana@mail.com")
    beto = await create_user(email="beto@mail.com")
    account = await create_account(beto, owner_name="Beto", others=("Ana",), closed=True)
    await link(db, account, "Ana", ana)

    await _delete(client, beto, email_outbox)

    doc = await db.accounts.find_one({"_id": account["_id"]})
    assert doc["ownerId"] == ana["_id"] and doc["isDeleted"] is False
    assert doc["participants"][0]["anonymizedAt"] is not None


async def test_two_members_deleting_at_once(client, db, create_user, create_account, email_outbox):
    ana = await create_user(email="ana@mail.com")
    beto = await create_user(email="beto@mail.com")
    account = await create_account(ana, others=("Beto",))
    await link(db, account, "Beto", beto)
    codes = {}
    for user in (ana, beto):
        await client.post(REQUEST, headers=auth_headers(user["_id"]))
        codes[user["_id"]] = last_code(email_outbox, user["email"])

    await asyncio.gather(
        *(
            account_deletion_service.confirm_deletion(user["_id"], codes[user["_id"]], "web")
            for user in (ana, beto)
        )
    )

    doc = await db.accounts.find_one({"_id": account["_id"]})
    assert doc["isDeleted"] is True
    assert all(p["userId"] is None and p["anonymizedAt"] for p in doc["participants"][:2])


async def test_renaming_the_deleted_user_makes_it_a_free_participant(
    client, db, create_user, create_account, email_outbox
):
    ana = await create_user(email="ana@mail.com")
    beto = await create_user(email="beto@mail.com")
    account = await create_account(ana, others=("Beto",))
    beto_pid = await link(db, account, "Beto", beto)
    await _delete(client, beto, email_outbox)

    headers = auth_headers(ana["_id"])
    renamed = await client.patch(
        f"/accounts/{account['_id']}/participants/{beto_pid}",
        json={"name": "Primo de Beto"},
        headers=headers,
    )
    assert renamed.status_code == 200, renamed.text
    doc = await db.accounts.find_one({"_id": account["_id"]})
    participant = next(p for p in doc["participants"] if p["id"] == beto_pid)
    assert participant["anonymizedAt"] is None and participant["name"] == "Primo de Beto"
    removed = await client.delete(
        f"/accounts/{account['_id']}/participants/{beto_pid}", headers=headers
    )
    assert removed.status_code in (200, 204)


async def test_the_service_rejects_a_wrong_code_without_changes(db, create_user, create_account):
    beto = await create_user(email="beto@mail.com")
    await create_account(beto)
    with pytest.raises(AppError):
        await account_deletion_service.confirm_deletion(beto["_id"], "123456", "web")
    assert await db.users.find_one({"_id": beto["_id"]}) is not None
