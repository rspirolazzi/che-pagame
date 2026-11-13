"""Public health and version endpoint (feature 009, contracts/health.md).

Used by the production healthcheck and by support to see which commit is running. It reports
the status and the build information only: no configuration, environment or error details.
"""

import asyncio
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.build_info import get_build_info
from app.db import client as mongo

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])

PING_TIMEOUT_SECONDS = 2


async def ping_database() -> None:
    await mongo.get_client().admin.command("ping")


@router.get("/health")
async def health() -> JSONResponse:
    status_code, status = 200, "ok"
    try:
        await asyncio.wait_for(ping_database(), timeout=PING_TIMEOUT_SECONDS)
    except Exception as exc:
        # Only the exception type: its message may contain the connection string.
        logger.warning("Health check: database unavailable (%s)", type(exc).__name__)
        status_code, status = 503, "unavailable"
    return JSONResponse(
        status_code=status_code,
        content={"status": status, "build": get_build_info()},
        headers={"Cache-Control": "no-store"},
    )
