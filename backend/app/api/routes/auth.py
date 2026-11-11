from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.services.auth_service import (
    find_user,
    hash_password,
    issue_token,
    revoke_token,
    user_by_token,
    verify_password,
)

router = APIRouter()


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return authorization[7:].strip()


async def current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await user_by_token(db, _bearer(authorization))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    return user


def _user_out(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        display_name=user.display_name,
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    username = body.username.lower()
    email = body.email.lower() if body.email else None
    taken = await db.execute(
        select(User.id).where(
            or_(User.username == username, User.email == email)
            if email
            else User.username == username
        )
    )
    if taken.first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Login or e-mail already taken")
    user = User(
        username=username,
        email=email,
        display_name=body.display_name or body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return AuthResponse(token=await issue_token(db, user), user=_user_out(user))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await find_user(db, body.identifier)
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong login or password")
    return AuthResponse(token=await issue_token(db, user), user=_user_out(user))


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(current_user)):
    return _user_out(user)


@router.post("/logout", status_code=204)
async def logout(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    await revoke_token(db, _bearer(authorization))


@router.delete("/me", status_code=204)
async def delete_me(
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
):
    await db.delete(user)
    await db.commit()
