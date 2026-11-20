"""Expenses and settlements listed together (feature 012, contracts/movements-api.md)."""

from typing import Annotated, Literal

from pydantic import Field

from app.schemas.common import CamelModel
from app.schemas.expense import ExpenseListItem
from app.schemas.settlement import SettlementResponse


class ExpenseMovement(CamelModel):
    kind: Literal["expense"] = "expense"
    expense: ExpenseListItem


class SettlementMovement(CamelModel):
    kind: Literal["settlement"] = "settlement"
    settlement: SettlementResponse


Movement = Annotated[ExpenseMovement | SettlementMovement, Field(discriminator="kind")]


class MovementPage(CamelModel):
    items: list[Movement]
    next_cursor: str | None
    # Expenses only, on the first page: settlements are not group spending (FR-007).
    total: str | None
    count: int | None
