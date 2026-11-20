from fastapi import APIRouter, Response

from app.core.config import get_settings
from app.schemas.contact import PublicConfig

router = APIRouter(prefix="/public-config", tags=["public-config"])


@router.get("", response_model=PublicConfig)
async def public_config(response: Response) -> PublicConfig:
    """The Turnstile site key in production, null elsewhere (feature 017, research R5)."""
    settings = get_settings()
    response.headers["Cache-Control"] = "public, max-age=300"
    key = settings.cloudflare_turnstile_site_key if settings.bot_check_enabled else ""
    return PublicConfig(turnstile_site_key=key or None)
