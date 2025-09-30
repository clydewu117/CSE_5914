from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for creating a new user"""

    email: EmailStr
    username: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    """Schema for user login"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)"""

    id: int
    email: str
    username: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token"""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token data"""

    email: Optional[str] = None
