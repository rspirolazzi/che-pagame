from fastapi import APIRouter, Response, status

from app.api.v1.dependencies import ClientDep
from app.schemas.common import ErrorResponse
from app.schemas.contact import ContactRequest
from app.services import contact_service, rate_limit_service, turnstile_service

router = APIRouter(prefix="/contact", tags=["contact"])

_errors = {
    403: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    429: {"model": ErrorResponse},
    502: {"model": ErrorResponse},
}


@router.post("", status_code=status.HTTP_202_ACCEPTED, response_class=Response, responses=_errors)
async def send_contact_message(body: ContactRequest, client: ClientDep) -> Response:
    """Relays the message to the maintainer's WhatsApp (feature 017). Nothing is stored."""
    await turnstile_service.verify(body.turnstile_token)
    attempts = await rate_limit_service.check_and_record_contact(str(body.email))
    try:
        await contact_service.send(
            contact_service.ContactMessage(
                name=body.name,
                email=str(body.email),
                message=body.message,
                language=body.language,
                client=client,
            )
        )
    except Exception:
        # A message that was not delivered does not count against the limits.
        for attempt in attempts:
            await rate_limit_service.release(attempt)
        raise
    return Response(status_code=status.HTTP_202_ACCEPTED)
