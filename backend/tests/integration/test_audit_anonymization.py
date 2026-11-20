"""Feature 015, research R5: a deleted user's personal data leaves the audit, the entries stay."""

from datetime import UTC, datetime

from bson import ObjectId

from app.db.client import transaction
from app.repositories import audit_logs

DELETED = "[deleted]"


async def _entry(db, **fields):
    doc = {
        "actorUserId": fields.pop("actor", None),
        "action": fields.pop("action"),
        "entityType": fields.pop("entity_type", "user"),
        "entityId": fields.pop("entity_id", None),
        "changes": fields.pop("changes", {}),
        "metadata": {"client": "web"},
        "createdAt": datetime.now(UTC),
        **fields,
    }
    doc["_id"] = (await db.audit_logs.insert_one(doc)).inserted_id
    return doc


async def _anonymize(user_id, participants):
    async with transaction() as session:
        await audit_logs.anonymize_user(user_id, participants, session=session)


async def test_user_entries_lose_email_and_names(db):
    beto, other = ObjectId(), ObjectId()
    changed = await _entry(
        db,
        action="user.email_changed",
        actor=beto,
        entity_id=beto,
        changes={"email": {"before": "beto@mail.com", "after": "new@mail.com"}},
    )
    requested = await _entry(
        db,
        action="user.email_change_requested",
        actor=beto,
        entity_id=beto,
        changes={"pendingEmail": {"before": None, "after": "new@mail.com"}},
    )
    profile = await _entry(
        db,
        action="user.profile_updated",
        actor=beto,
        entity_id=beto,
        changes={
            "firstName": {"before": None, "after": "Beto"},
            "lastName": {"before": "Gómez", "after": "Pérez"},
            "preferences.theme": {"before": "light", "after": "dark"},
        },
    )
    untouched = await _entry(
        db,
        action="user.profile_updated",
        actor=other,
        entity_id=other,
        changes={"firstName": {"before": None, "after": "Caro"}},
    )

    await _anonymize(beto, [])

    doc = await db.audit_logs.find_one({"_id": changed["_id"]})
    assert doc["changes"] == {"email": {"before": DELETED, "after": DELETED}}
    assert doc["action"] == "user.email_changed" and doc["actorUserId"] == beto
    assert doc["createdAt"] is not None
    doc = await db.audit_logs.find_one({"_id": requested["_id"]})
    assert doc["changes"] == {"pendingEmail": {"before": None, "after": DELETED}}
    doc = await db.audit_logs.find_one({"_id": profile["_id"]})
    assert doc["changes"]["firstName"] == {"before": None, "after": DELETED}
    assert doc["changes"]["lastName"] == {"before": DELETED, "after": DELETED}
    assert doc["changes"]["preferences.theme"] == {"before": "light", "after": "dark"}
    doc = await db.audit_logs.find_one({"_id": untouched["_id"]})
    assert doc["changes"]["firstName"]["after"] == "Caro"
    assert await db.audit_logs.count_documents({}) == 4


async def test_account_entries_lose_the_names_of_its_participant(db):
    beto = ObjectId()
    account_id = ObjectId()
    pid, other_pid = "p-beto", "p-ana"
    created = await _entry(
        db,
        action="account.created",
        actor=ObjectId(),
        entity_type="account",
        entity_id=account_id,
        changes={"participants": {"after": ["Ana", "Betito"]}},
    )
    renamed = await _entry(
        db,
        action="account.participant_renamed",
        entity_type="account",
        entity_id=account_id,
        accountId=account_id,
        changes={f"participant.{pid}.name": {"before": "Betito", "after": "Beto"}},
    )
    joined = await _entry(
        db,
        action="account.member_joined",
        entity_type="account",
        entity_id=account_id,
        accountId=account_id,
        changes={
            f"participant.{pid}.userId": {"before": None, "after": beto},
            "participant": {"after": {"id": pid, "name": "Beto"}},
        },
    )
    other = await _entry(
        db,
        action="account.participant_renamed",
        entity_type="account",
        entity_id=account_id,
        accountId=account_id,
        changes={f"participant.{other_pid}.name": {"before": "Anita", "after": "Ana"}},
    )

    await _anonymize(beto, [(account_id, pid, "Beto")])

    doc = await db.audit_logs.find_one({"_id": created["_id"]})
    assert doc["changes"]["participants"]["after"] == ["Ana", DELETED]
    doc = await db.audit_logs.find_one({"_id": renamed["_id"]})
    assert doc["changes"][f"participant.{pid}.name"] == {"before": DELETED, "after": DELETED}
    doc = await db.audit_logs.find_one({"_id": joined["_id"]})
    assert doc["changes"]["participant"]["after"] == {"id": pid, "name": DELETED}
    assert doc["changes"][f"participant.{pid}.userId"]["after"] == beto
    doc = await db.audit_logs.find_one({"_id": other["_id"]})
    assert doc["changes"][f"participant.{other_pid}.name"] == {"before": "Anita", "after": "Ana"}
