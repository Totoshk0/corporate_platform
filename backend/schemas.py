from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Position(BaseModel):
    id: int
    title: str
    level: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str
    position_id: Optional[int] = None

class User(UserBase):
    id: int
    position: Optional[Position] = None

    class Config:
        from_attributes = True

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
