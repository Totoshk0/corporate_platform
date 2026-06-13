import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base
import datetime

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    TECH_SPEC = "TECH_SPEC" # Тех. специалист, выдающий доступы

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # "Бухгалтерия", "Отдел кадров" и т.д.

    users = relationship("User", back_populates="department")
    items = relationship("KnowledgeBaseItem", back_populates="department")

class CompanyRole(Base):
    __tablename__ = "company_roles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True)
    level = Column(String) # TOP, MIDDLE, LOW

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String) # ФИО
    username = Column(String, unique=True, index=True) # IvanovII
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    system_role = Column(Enum(UserRole), default=UserRole.USER)
    role_id = Column(Integer, ForeignKey("company_roles.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    company_role = relationship("CompanyRole")
    department = relationship("Department", back_populates="users")
    temp_accesses = relationship("TemporaryAccess", back_populates="user")

class TemporaryAccess(Base):
    __tablename__ = "temporary_access"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_department_id = Column(Integer, ForeignKey("departments.id"))
    access_password = Column(String) # Единоразовый пароль
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="temp_accesses")
    target_department = relationship("Department")

class KnowledgeBaseItem(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text) # Полный текст для истории и подписей потом доделать!!!!!!!!

    department_id = Column(Integer, ForeignKey("departments.id"))
    doc_type = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(String, default="draft") # draft, signed, archived
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="items")
    author = relationship("User")
    chunks = relationship("KnowledgeBaseChunk", back_populates="item", cascade="all, delete-orphan")
    signatories = relationship("DocumentSignatory", back_populates="item", cascade="all, delete-orphan")
    distributions = relationship("DocumentDistribution", back_populates="item", cascade="all, delete-orphan")

class DocumentSignatory(Base):
    __tablename__ = "document_signatories"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("knowledge_base.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    is_signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)

    item = relationship("KnowledgeBaseItem", back_populates="signatories")
    user = relationship("User")

class DocumentDistribution(Base):
    __tablename__ = "document_distributions"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("knowledge_base.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Кому лично
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True) # Всему отделу

    item = relationship("KnowledgeBaseItem", back_populates="distributions")
    user = relationship("User")
    department = relationship("Department")

class KnowledgeBaseChunk(Base):
    __tablename__ = "knowledge_base_chunks"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("knowledge_base.id", ondelete="CASCADE"))
    embedding = Column(Vector(1024))
    payload = Column(Text) # JSON с метаданными
    content_chunk = Column(Text)

    item = relationship("KnowledgeBaseItem", back_populates="chunks")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String) # user / assistant
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    sender = relationship("User")
