from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DepartmentSchema(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class CompanyRoleSchema(BaseModel):
    id: int
    title: str
    level: str
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    full_name: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    system_role: str
    department: Optional[DepartmentSchema] = None
    company_role: Optional[CompanyRoleSchema] = None
    class Config:
        from_attributes = True

class AccessGrantCreate(BaseModel):
    user_id: int
    target_department_id: int
    duration_hours: Optional[int] = 8 # По умолчанию до конца дня

class AccessGrantResponse(BaseModel):
    access_password: str
    expires_at: datetime
    class Config:
        from_attributes = True

class AccessVerify(BaseModel):
    access_password: str

class KBItemBase(BaseModel):
    title: str
    content: str
    doc_type: str
    department_id: int

class KBItem(KBItemBase):
    id: int
    author_id: Optional[int]
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class KBChunkSchema(BaseModel):
    id: int
    item_id: int
    content_chunk: str
    payload: str
    score: Optional[float] = None
    class Config:
        from_attributes = True

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5
    access_password: Optional[str] = None # Сюда передаем пароль для доступа к чужим отделам

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
