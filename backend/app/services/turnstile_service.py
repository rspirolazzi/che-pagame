"""Cloudflare Turnstile check on the server (feature 017, research R2).

Only in production: elsewhere every check passes without calling Cloudflare, so development and
the tests need no credentials. Cloudflare itself rejects a token used twice
("timeout-or-duplicate"), so tokens are not stored here.
"""

import asyncio
import json
import logging
import urllib.parse
import urllib.request

from app.core import errors
from app.core.config import get_settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
TIMEOUT_SECONDS = 5
MAX_TOKEN_LENGTH = 2048


def _post(url: str, form: dict[str, str]) -> dict:
    """POST a form and read the JSON answer (blocking: runs in a thread)."""
    body = urllib.parse.urlencode(form).encode()
    # The URL is the fixed https SITEVERIFY_URL.
    request = urllib.request.Request(url, data=body, method="POST")  # noqa: S310
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:  # noqa: S310
        return json.loads(response.read().decode())


async def verify(token: str | None) -> None:
    """Raise 403 bot_check_failed unless Cloudflare accepts the token (production only)."""
    settings = get_settings()
    if not settings.bot_check_enabled:
        return
    if not token or len(token) > MAX_TOKEN_LENGTH:
        raise AppError(403, errors.BOT_CHECK_FAILED)
    try:
        result = await asyncio.to_thread(
            _post,
            SITEVERIFY_URL,
            {"secret": settings.cloudflare_turnstile_secret_key, "response": token},
        )
    except Exception as exc:
        # Network error or timeout: fail closed, without logging the token or the secret.
        logger.warning("turnstile check unavailable: %s", type(exc).__name__)
        raise AppError(403, errors.BOT_CHECK_FAILED) from exc
    if not result.get("success"):
        logger.info("turnstile check rejected: %s", ",".join(result.get("error-codes", [])))
        raise AppError(403, errors.BOT_CHECK_FAILED)
