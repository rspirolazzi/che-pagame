"""Deleting the current user's account (feature 015, research R1–R7).

Everything happens in one transaction: verify the code, anonymize the user's participant in every
account (moving the Owner role or deleting accounts left without registered members), scrub the
user's personal data from the audit, drop sessions, codes and pending registrations, and finally
delete the user document. Logs only carry the user id (Principle VI).
"""

import logging
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo.asynchronous.client_session import AsyncClientSession

from app.core import errors
from app.core.errors import AppError
from app.db.client import run_in_transaction
from app.repositories import (
    accounts,
    audit_logs,
    pending_registrations,
    refresh_tokens,
    users,
    verification_codes,
)
from app.services import audit_service, verification_service

logger = logging.getLogger(__name__)

# Stored name of a deleted user's participant; responses translate it (participant_display_name).
STORED_DELETED_NAME = "Usuario eliminado"


def deleted_name_key(participant_id: str) -> str:
    """A name key no real name can produce, so two deleted users never clash."""
    return f"\u0000deleted:{participant_id}"


async def request_deletion(user_id: ObjectId, client: str) -> None:
    user = await users.find_by_id(user_id)
    if user is None:
        raise AppError(401, errors.UNAUTHORIZED)
    await verification_service.issue_code(
        email=user["email"],
        purpose="delete_account",
        limit_purpose="delete_account",
        template="delete_account",
        language=(user.get("preferences") or {}).get("language", "es"),
        user_id=user_id,
    )
    logger.info("Account deletion code requested for user %s (%s)", user_id, client)


def _joined_at(participant: dict[str, Any]) -> datetime:
    return (
        participant.get("linkedAt")
        or participant.get("joinedAt")
        or datetime.max.replace(tzinfo=UTC)
    )


def _next_owner(doc: dict[str, Any], user_id: ObjectId) -> ObjectId | None:
    """The registered member who joined first, other than the deleted user."""
    candidates = [
        p
        for p in doc["participants"]
        if p.get("removedAt") is None and p.get("userId") not in (None, user_id)
    ]
    if not candidates:
        return None
    return min(candidates, key=_joined_at)["userId"]


async def _leave_accounts(
    user_id: ObjectId, client: str, session: AsyncClientSession
) -> tuple[list[tuple[ObjectId, str, str]], int, int]:
    """Anonymize the user's participants; returns them plus the deleted and kept account counts."""
    anonymized: list[tuple[ObjectId, str, str]] = []
    deleted = kept = 0
    now = datetime.now(UTC)
    for doc in await accounts.list_linked_to(user_id, session=session):
        participant = next(
            p
            for p in doc["participants"]
            if p.get("userId") == user_id and p.get("removedAt") is None
        )
        pid = participant["id"]
        next_owner = _next_owner(doc, user_id)
        fields: dict[str, Any] = {
            "participants.$[p].userId": None,
            "participants.$[p].anonymizedAt": now,
            "participants.$[p].name": STORED_DELETED_NAME,
            "participants.$[p].nameKey": deleted_name_key(pid),
        }
        changes: dict[str, Any] = {f"participant.{pid}.userId": {"before": user_id, "after": None}}
        if next_owner is None:
            if not doc.get("isDeleted"):
                fields.update({"isDeleted": True, "deletedAt": now})
                changes["isDeleted"] = {"before": False, "after": True}
            deleted += 1
        else:
            if doc["ownerId"] == user_id:
                fields["ownerId"] = next_owner
                changes["ownerId"] = {"before": user_id, "after": next_owner}
            kept += 1
        await accounts.update(
            doc["_id"],
            {"$set": fields},
            session=session,
            array_filters=[{"p.id": pid, "p.userId": user_id}],
        )
        await audit_service.record(
            "account.member_deleted",
            actor_user_id=user_id,
            entity_id=doc["_id"],
            changes=changes,
            metadata={"client": client},
            session=session,
            entity_type="account",
            account_id=doc["_id"],
        )
        anonymized.append((doc["_id"], pid, participant["name"]))
    return anonymized, deleted, kept


async def confirm_deletion(user_id: ObjectId, code: str, client: str) -> None:
    user = await users.find_by_id(user_id)
    if user is None:
        raise AppError(401, errors.UNAUTHORIZED)
    emails = [user["email"]] + ([user["pendingEmail"]] if user.get("pendingEmail") else [])

    async def write(session: AsyncClientSession) -> tuple[int, int]:
        await verification_service.verify_code(user["email"], "delete_account", code, session)
        participants, deleted, kept = await _leave_accounts(user_id, client, session)
        await audit_logs.anonymize_user(user_id, participants, session=session)
        await audit_service.record(
            "user.deleted",
            actor_user_id=user_id,
            entity_id=user_id,
            changes={},
            metadata={"client": client, "accountsDeleted": deleted, "accountsKept": kept},
            session=session,
        )
        await refresh_tokens.delete_all_for_user(user_id, session=session)
        await verification_codes.delete_for_emails(emails, session=session)
        await pending_registrations.delete_for_emails(emails, session=session)
        await users.delete(user_id, session=session)
        return deleted, kept

    deleted, kept = await run_in_transaction(write)
    logger.info(
        "Account deletion completed for user %s (%s): %d accounts deleted, %d kept",
        user_id,
        client,
        deleted,
        kept,
    )
