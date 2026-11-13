import time
import uuid

import httpx

from app.core.config import settings

OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

_token: str | None = None
_token_expires_at: float = 0.0  # unix seconds


class GigaChatError(Exception):
    pass


async def _get_token(client: httpx.AsyncClient) -> str:
    global _token, _token_expires_at

    if _token and time.time() < _token_expires_at - 60:
        return _token

    response = await client.post(
        OAUTH_URL,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "RqUID": str(uuid.uuid4()),
            "Authorization": f"Basic {settings.GIGACHAT_AUTH_KEY}",
        },
        data={"scope": settings.GIGACHAT_SCOPE},
    )
    if response.status_code != 200:
        raise GigaChatError(f"oauth failed: {response.status_code}")

    payload = response.json()
    _token = payload["access_token"]
    # expires_at is in milliseconds
    _token_expires_at = float(payload["expires_at"]) / 1000
    return _token


async def chat(system: str, user: str, *, temperature: float = 0.3) -> str:
    if not settings.GIGACHAT_AUTH_KEY:
        raise GigaChatError("GIGACHAT_AUTH_KEY is not set")

    async with httpx.AsyncClient(
        verify=settings.GIGACHAT_VERIFY_SSL, timeout=60
    ) as client:
        token = await _get_token(client)
        response = await client.post(
            CHAT_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "model": settings.GIGACHAT_MODEL,
                "temperature": temperature,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        if response.status_code != 200:
            raise GigaChatError(f"chat failed: {response.status_code}")

        return response.json()["choices"][0]["message"]["content"]
