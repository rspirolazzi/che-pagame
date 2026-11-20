"""Contact form messages sent to the maintainer's WhatsApp through CallMeBot (feature 017, R3).

Messages are never stored. Logs never include the name, the email, the text, the phone or the
API key (FR-003, Principle VI). Outside production nothing is sent: the message is only counted
in the log.
"""

import asyncio
import logging
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime

from app.core import errors
from app.core.config import get_settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 5
MAX_TEXT_LENGTH = 1800


@dataclass(frozen=True)
class ContactMessage:
    name: str
    email: str
    message: str
    language: str
    client: str


def build_text(contact: ContactMessage, now: datetime | None = None) -> str:
    """Plain text for WhatsApp, cut to MAX_TEXT_LENGTH."""
    sent_at = (now or datetime.now(UTC)).strftime("%Y-%m-%d %H:%M UTC")
    text = (
        "ChePagame – nuevo mensaje de contacto\n"
        f"Nombre: {contact.name}\n"
        f"Email: {contact.email}\n"
        f"Idioma: {contact.language} · Cliente: {contact.client}\n"
        f"Fecha: {sent_at}\n\n"
        f"{contact.message}"
    )
    return text[:MAX_TEXT_LENGTH]


def _get(url: str) -> int:
    """GET the URL and return the HTTP status (blocking: runs in a thread)."""
    with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as response:  # noqa: S310
        return response.status


async def send(contact: ContactMessage) -> None:
    settings = get_settings()
    if not settings.bot_check_enabled:
        logger.info(
            "contact message received (not sent outside production)",
            extra={
                "length": len(contact.message),
                "language": contact.language,
                "client": contact.client,
            },
        )
        return
    query = urllib.parse.urlencode(
        {
            "phone": settings.callmebot_phone,
            "text": build_text(contact),
            "apikey": settings.callmebot_apikey,
        }
    )
    separator = "&" if "?" in settings.callmebot_url else "?"
    try:
        status = await asyncio.to_thread(_get, f"{settings.callmebot_url}{separator}{query}")
    except Exception as exc:
        # The URL carries the API key: only the exception type is logged.
        logger.warning("contact message not delivered: %s", type(exc).__name__)
        raise AppError(502, errors.CONTACT_UNAVAILABLE) from exc
    if not 200 <= status < 300:
        logger.warning("contact message not delivered: status %s", status)
        raise AppError(502, errors.CONTACT_UNAVAILABLE)
    logger.info("contact message delivered", extra={"client": contact.client})
