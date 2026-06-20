from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserPublic


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_lowercase(cls, value: str) -> str:
        return value.lower()


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def username_lowercase(cls, value: str) -> str:
        return value.lower()


class AuthResponse(BaseModel):
    user: UserPublic
    message: str = "Authenticated"
