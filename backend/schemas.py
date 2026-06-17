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
    system_role: Optional[str] = "USER"
    department_id: Optional[int] = None
    role_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None # Если пустой - не меняем
    system_role: Optional[str] = None
    department_id: Optional[int] = None
    role_id: Optional[int] = None

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

class DocumentCreateRequest(BaseModel):
    template_id: int
    signatory_user_ids: List[int]
    distribution_user_ids: List[int] = []
    distribution_department_ids: List[int] = []

class SignatorySchema(BaseModel):
    user_id: int
    full_name: str
    is_signed: bool
    signed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class DistributionSchema(BaseModel):
    user_id: Optional[int] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

class ChatMessageSchema(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    class Config:
        from_attributes = True

class ChatSessionSchema(BaseModel):
    id: int
    title: str
    created_at: datetime
    is_deleted: bool = False
    class Config:
        from_attributes = True
    user_id: Optional[int] = None # Для админки

class ChatAskRequest(BaseModel):
    query: str
    session_id: Optional[int] = None # Если пусто - создастся новый чат

class ChatResponse(BaseModel):
    session_id: int
    answer: str # Пока заглушка
    sources: List[int] = [] # ID документов, которые нашел поиск

class KBItemExtended(KBItem):
    signatories: List[SignatorySchema] = []
    distributions: List[DistributionSchema] = []

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5
    access_password: Optional[str] = None # Сюда передаем пароль для доступа к чужим отделам

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
