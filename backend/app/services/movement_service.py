"""Expenses and settlements of an account in one list (feature 012, research R1).

Both collections share the (date, createdAt, _id) keyset, so merging one page of each read with
the same cursor gives an exact page of the combined list.
"""

from typing import Any

from bson import ObjectId

from app.core.cursor import decode_cursor, encode_cursor
from app.core.money import format_amount
from app.repositories import expenses, settlements
from app.schemas.movement import ExpenseMovement, MovementPage, SettlementMovement
from app.services.account_permissions import require_member
from app.services.expense_service import to_list_item
from app.services.settlement_service import to_settlement_response


def _sort_key(doc: dict[str, Any]) -> tuple[str, Any, ObjectId]:
    return (doc["date"], doc["createdAt"], doc["_id"])


async def list_movements(
    account_id: str, user_id: ObjectId, limit: int, cursor: str | None
) -> MovementPage:
    account = await require_member(account_id, user_id)
    after = decode_cursor(cursor) if cursor else None
    expense_docs = await expenses.page(account["_id"], limit + 1, after)
    settlement_docs = await settlements.page(account["_id"], limit + 1, after)
    tagged = [("expense", doc) for doc in expense_docs] + [
        ("settlement", doc) for doc in settlement_docs
    ]
    tagged.sort(key=lambda item: _sort_key(item[1]), reverse=True)
    has_more = len(tagged) > limit
    page = tagged[:limit]
    items: list[ExpenseMovement | SettlementMovement] = [
        ExpenseMovement(expense=to_list_item(doc, account))
        if kind == "expense"
        else SettlementMovement(settlement=to_settlement_response(doc, account))
        for kind, doc in page
    ]
    total: str | None = None
    count: int | None = None
    if cursor is None:
        total_minor, count = await expenses.totals(account["_id"])
        total = format_amount(total_minor, account["currency"])
    return MovementPage(
        items=items,
        next_cursor=encode_cursor(page[-1][1]) if has_more and page else None,
        total=total,
        count=count,
    )
