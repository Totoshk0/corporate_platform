from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CompanyRole(BaseModel):
    id: int
    title: str
    level: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    system_role: str
    company_role: Optional[CompanyRole] = None

    class Config:
        from_attributes = True

class UserUpdateRole(BaseModel):
    system_role: Optional[str] = None
    role_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class KBItemBase(BaseModel):
    title: str
    content: str

class KBItemCreate(KBItemBase):
    pass

class KBItem(KBItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5
