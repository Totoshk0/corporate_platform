from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
