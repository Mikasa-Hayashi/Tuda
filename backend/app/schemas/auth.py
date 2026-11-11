import re

from pydantic import BaseModel, Field, field_validator

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,32}$")


class RegisterRequest(BaseModel):
    username: str
    email: str | None = None
    password: str = Field(min_length=6, max_length=128)
    display_name: str | None = Field(default=None, max_length=64)

    @field_validator("username")
    @classmethod
    def _username(cls, v: str) -> str:
        v = v.strip()
        if not USERNAME_RE.match(v):
            raise ValueError("username: 3-32 letters, digits, _ . -")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        v = v.strip()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("invalid e-mail")
        return v


class LoginRequest(BaseModel):
    identifier: str  # username or e-mail
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None
    display_name: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
