from typing import Annotated

from fastapi import APIRouter, Query

from app.api.v1.dependencies import CurrentUserId
from app.schemas.common import ErrorResponse
from app.schemas.expense import PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX
from app.schemas.movement import MovementPage
from app.services import movement_service

router = APIRouter(prefix="/accounts/{account_id}/movements", tags=["movements"])

_errors = {
    401: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
}


@router.get("", response_model=MovementPage, responses=_errors)
async def list_movements(
    account_id: str,
    user_id: CurrentUserId,
    limit: Annotated[int, Query(ge=1, le=PAGE_SIZE_MAX)] = PAGE_SIZE_DEFAULT,
    cursor: Annotated[str | None, Query(max_length=512)] = None,
) -> MovementPage:
    """Expenses and settlements together, newest first (feature 012)."""
    return await movement_service.list_movements(account_id, user_id, limit, cursor)
