"""Contact form and public configuration (feature 017, contracts/contact-and-bot-check-api.md)."""

from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import CamelModel
from app.schemas.user import LanguageCode


class ContactRequest(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(min_length=10, max_length=2000)
    language: LanguageCode = "es"
    # Explicit consent to relay the message through CallMeBot (FR-013, Principle VI).
    consent: Literal[True]
    turnstile_token: str | None = Field(default=None, max_length=2048)

    @field_validator("name", "message", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class PublicConfig(CamelModel):
    """What clients need before signing in. The site key is public by design."""

    turnstile_site_key: str | None
