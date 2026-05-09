import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base
import datetime

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class CompanyRole(Base):
    __tablename__ = "company_roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True)
    level = Column(String) # 'TOP', 'MIDDLE', 'LOWER'

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    system_role = Column(Enum(UserRole), default=UserRole.USER)
    role_id = Column(Integer, ForeignKey("company_roles.id"), nullable=True)

    company_role = relationship("CompanyRole")
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User")

class KnowledgeBaseItem(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    # 384 - это размерность для 'all-MiniLM-L6-v2'
    embedding = Column(Vector(384))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
