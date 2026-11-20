"""Insert and read access to `audit_logs` (Principle IV).

Entries are never updated or deleted, with one exception: `anonymize_user` replaces the personal
data of a user who deleted their account (constitution 4.9.0, Principle VI; feature 015). The
entries themselves stay, with who, what and when by internal id. The API never exposes it.
"""

from collections.abc import Iterable
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.asynchronous.client_session import AsyncClientSession

from app.db.client import get_database

COLLECTION = "audit_logs"


async def insert(
    *,
    action: str,
    actor_user_id: ObjectId | None,
    entity_id: ObjectId | None,
    changes: dict[str, Any],
    metadata: dict[str, Any],
    entity_type: str = "user",
    account_id: ObjectId | None = None,
    session: AsyncClientSession | None = None,
) -> None:
    document: dict[str, Any] = {
        "actorUserId": actor_user_id,
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "changes": changes,
        "metadata": metadata,
        "createdAt": datetime.now(UTC),
    }
    # Only new entries carry accountId; older account.* entries keep it in entityId (research R8).
    if account_id is not None:
        document["accountId"] = account_id
    await get_database()[COLLECTION].insert_one(document, session=session)


async def list_for_entity(entity_type: str, entity_id: ObjectId) -> list[dict[str, Any]]:
    """Entries of one entity, most recent first (read-only)."""
    cursor = (
        get_database()[COLLECTION]
        .find({"entityType": entity_type, "entityId": entity_id})
        .sort([("createdAt", DESCENDING), ("_id", DESCENDING)])
    )
    return [doc async for doc in cursor]


DELETED_VALUE = "[deleted]"

# Personal fields of a user that audit entries may hold in `changes` (before/after).
_USER_PERSONAL_FIELDS = ("email", "pendingEmail", "firstName", "lastName")


def _blank(change: Any) -> Any:
    """`{before, after}` with every non-null value replaced by the deleted marker."""
    if not isinstance(change, dict):
        return change
    return {k: (DELETED_VALUE if v is not None else None) for k, v in change.items()}


def _participant_names(changes: dict[str, Any], participant_id: str) -> set[str]:
    names: set[str] = set()
    for value in (changes.get(f"participant.{participant_id}.name") or {}).values():
        if isinstance(value, str):
            names.add(value)
    for value in (changes.get("participant") or {}).values():
        if isinstance(value, dict) and value.get("id") == participant_id and value.get("name"):
            names.add(value["name"])
    return names


def _anonymize_account_changes(
    changes: dict[str, Any], participant_id: str, names: set[str]
) -> dict[str, Any]:
    result = dict(changes)
    key = f"participant.{participant_id}.name"
    if key in result:
        result[key] = _blank(result[key])
    if isinstance(result.get("participant"), dict):
        result["participant"] = {
            side: (
                {**value, "name": DELETED_VALUE}
                if isinstance(value, dict) and value.get("id") == participant_id
                else value
            )
            for side, value in result["participant"].items()
        }
    if isinstance(result.get("participants"), dict):
        result["participants"] = {
            side: (
                [DELETED_VALUE if name in names else name for name in value]
                if isinstance(value, list)
                else value
            )
            for side, value in result["participants"].items()
        }
    return result


async def anonymize_user(
    user_id: ObjectId,
    participants: Iterable[tuple[ObjectId, str, str]],
    session: AsyncClientSession | None = None,
) -> None:
    """Replace a deleted user's personal data in existing entries (the only allowed change).

    - Entries about the user: `email`, `pendingEmail`, `firstName` and `lastName` values.
    - Entries of each account in `participants` (account id, participant id, current name): every
      name that participant had, in renames, additions, joins, removals and the creation list.
    """
    collection = get_database()[COLLECTION]
    cursor = collection.find({"entityType": "user", "entityId": user_id}, session=session)
    async for doc in cursor:
        changes = doc.get("changes") or {}
        new = {k: (_blank(v) if k in _USER_PERSONAL_FIELDS else v) for k, v in changes.items()}
        if new != changes:
            await collection.update_one(
                {"_id": doc["_id"]}, {"$set": {"changes": new}}, session=session
            )

    for account_id, participant_id, current_name in participants:
        query = {
            "$or": [{"accountId": account_id}, {"entityType": "account", "entityId": account_id}]
        }
        entries = [doc async for doc in collection.find(query, session=session)]
        names = {current_name}
        for doc in entries:
            names |= _participant_names(doc.get("changes") or {}, participant_id)
        for doc in entries:
            changes = doc.get("changes") or {}
            new = _anonymize_account_changes(changes, participant_id, names)
            if new != changes:
                await collection.update_one(
                    {"_id": doc["_id"]}, {"$set": {"changes": new}}, session=session
                )
