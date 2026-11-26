from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserPersonalData
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.schemas.personal_data import (
    PersonalData,
    PersonalDataRequest,
    PersonalDataResponse,
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


@router.post("/progress/sync", response_model=PersonalDataResponse)
async def sync_personal_data(
    body: PersonalDataRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonalDataResponse:
    write = body.write
    if write is not None:
        # The user row also serializes first writes before a progress row exists.
        locked_id = await db.scalar(
            select(User.id).where(User.id == user.id).with_for_update()
        )
        if locked_id is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    saved = await db.get(UserPersonalData, user.id)
    revision = saved.revision if saved else 0
    if write is None and body.revision == revision:
        return PersonalDataResponse(revision=revision, data=None, applied=False)

    writers = saved.writers if saved else {}
    already_applied = write is not None and writers.get(write.deviceId) == write.id
    if write is None or already_applied or body.revision != revision:
        return PersonalDataResponse(
            revision=revision,
            data=PersonalData.model_validate(saved.data) if saved else PersonalData(),
            applied=already_applied,
        )

    data = write.data.model_dump(mode="json")
    writers = {**writers, write.deviceId: write.id}
    if saved is None:
        saved = UserPersonalData(
            user_id=user.id, revision=1, data=data, writers=writers
        )
        db.add(saved)
    else:
        saved.revision = revision + 1
        saved.data = data
        saved.writers = writers
    await db.commit()
    return PersonalDataResponse(revision=revision + 1, data=write.data, applied=True)


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
