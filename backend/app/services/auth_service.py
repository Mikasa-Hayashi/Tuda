import hashlib
import hmac
import secrets

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import AuthToken, User


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_hex, digest_hex = stored.split("$")
        digest = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1
        )
    except ValueError:
        return False
    return hmac.compare_digest(digest.hex(), digest_hex)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def issue_token(db: AsyncSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AuthToken(user_id=user.id, token_hash=_token_hash(token)))
    await db.commit()
    return token


async def user_by_token(db: AsyncSession, token: str) -> User | None:
    result = await db.execute(
        select(User)
        .join(AuthToken, AuthToken.user_id == User.id)
        .where(AuthToken.token_hash == _token_hash(token))
    )
    return result.scalar_one_or_none()


async def revoke_token(db: AsyncSession, token: str) -> None:
    result = await db.execute(
        select(AuthToken).where(AuthToken.token_hash == _token_hash(token))
    )
    row = result.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()


async def find_user(db: AsyncSession, identifier: str) -> User | None:
    ident = identifier.strip().lower()
    result = await db.execute(
        select(User).where(or_(User.username == ident, User.email == ident))
    )
    return result.scalar_one_or_none()
