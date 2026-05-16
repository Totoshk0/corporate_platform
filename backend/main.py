import secrets
import string
import os
import json
import re
import unicodedata
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import models
import schemas
import auth
from database import engine, get_db, SessionLocal
from embeddings import embedding_service
from file_processor import file_processor
from create_samples import create_corporate_samples

app = FastAPI(
    title="Corporate Knowledge Hub API",
    description="Система корпоративной базы знаний с семантическим ИИ-поиском, гибридным ранжированием и контролем доступа.",
    version="1.0.0"
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Helper Functions (Chunking & Meta) ---

def split_text_into_chunks(text: str, chunk_size: int = 600, overlap: int = 100):
    """Разбивает текст на перекрывающиеся куски для лучшего контекста ИИ."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def extract_meta(text: str, filename: str):
    """Автоматическое извлечение метаданных (Даты, ФИО и тд) через Regex."""
    dates = re.findall(r'\d{2}\.\d{2}\.\d{4}', text)
    fio = re.findall(r'[А-Я][а-я]+\s[А-Я]\.[А-Я]\.', text)
    return {
        "source": filename,
        "date": dates[0] if dates else datetime.utcnow().strftime("%d.%m.%Y"),
        "author_mention": fio[0] if fio else "Не указан",
        "doc_type": filename.split('_')[0] if '_' in filename else "Документ"
    }

# --- Core KB Service ---

def upsert_document(db: Session, title: str, content: str, dept_id: int, doc_type: str, author_id: Optional[int] = None):
    item = models.KnowledgeBaseItem(
        title=title, content=content, department_id=dept_id,
        doc_type=doc_type, author_id=author_id
    )
    db.add(item)
    db.flush()

    text_chunks = split_text_into_chunks(content)

    for i, chunk_text in enumerate(text_chunks):
        meta = extract_meta(chunk_text, title)
        meta["chunk_id"] = i
        emb = embedding_service.generate_embedding(chunk_text)

        payload = {
            "content": chunk_text,
            "metadata": meta
        }

        chunk = models.KnowledgeBaseChunk(
            item_id=item.id,
            embedding=emb,
            content_chunk=chunk_text,
            payload=json.dumps(payload, ensure_ascii=False)
        )
        db.add(chunk)

    db.commit()
    return item

async def find_k(db: Session, query_text: str, allowed_depts: List[int], limit: int = 5):
    """
    Улучшенный Гибридный поиск: Vector + Title Boost + Russian & English Support.
    """
    query_emb = embedding_service.generate_embedding(query_text)

    sql = text("""
        SELECT
            c.item_id,
            c.content_chunk,
            c.payload,
            i.title as doc_title,
            (1 - (c.embedding <=> :emb)) as v_score,
            (
                ts_rank_cd(to_tsvector('russian', c.content_chunk), plainto_tsquery('russian', :query)) +
                ts_rank_cd(to_tsvector('russian', i.title), plainto_tsquery('russian', :query)) * 2.0 +
                ts_rank_cd(to_tsvector('simple', i.title), plainto_tsquery('simple', :query)) * 1.5
            ) as t_score
        FROM knowledge_base_chunks c
        JOIN knowledge_base i ON c.item_id = i.id
        WHERE i.department_id IN :depts
        ORDER BY ( (1 - (c.embedding <=> :emb)) * 0.4 +
                   (ts_rank_cd(to_tsvector('russian', c.content_chunk), plainto_tsquery('russian', :query)) +
                    ts_rank_cd(to_tsvector('russian', i.title), plainto_tsquery('russian', :query)) * 2.0 +
                    ts_rank_cd(to_tsvector('simple', i.title), plainto_tsquery('simple', :query)) * 1.5) * 0.6 ) DESC
        LIMIT :limit
    """)

    results = db.execute(sql, {
        "emb": str(query_emb),
        "query": query_text,
        "depts": tuple(allowed_depts),
        "limit": limit
    }).all()

    formatted = []
    for r in results:
        payload = json.loads(r.payload)
        formatted.append({
            "id": r.item_id,
            "title": r.doc_title,
            "content": r.content_chunk,
            "score": float(r.v_score * 0.4 + r.t_score * 0.6),
            "vector_score": float(r.v_score),
            "text_score": float(r.t_score),
            "payload": payload,
            "doc_type": payload["metadata"].get("doc_type", "Документ"),
            "department_id": 0
        })
    return formatted

# --- Dependencies ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
    except JWTError: raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None: raise credentials_exception
    return user

async def get_tech_spec(current_user: models.User = Depends(get_current_user)):
    if current_user.system_role not in [models.UserRole.ADMIN, models.UserRole.TECH_SPEC]:
        raise HTTPException(status_code=403, detail="Only Tech Specialists can grant access")
    return current_user

# --- Seeding Logic ---

def seed_knowledge_base(db: Session):
    if db.query(models.KnowledgeBaseItem).count() > 0:
        return

    print("Начинаю автоматическое наполнение базы знаний (Общий отдел + Специфические)...")
    create_corporate_samples()

    mapping = {
        # Специфические отделы
        "Приказ": ("Приказ", "Отдел делопроизводства"),
        "Указание": ("Указание", "Отдел делопроизводства"),
        "Устав": ("Устав", "Отдел делопроизводства"),
        "Протокол": ("Протокол", "Отдел делопроизводства"),
        "Решение": ("Решение", "Отдел делопроизводства"),
        "Распоряжение": ("Распоряжение", "Отдел делопроизводства"),
        "Отчет_за_март": ("Отчет", "Бухгалтерия"),
        "Счет_фактура": ("Счет-фактура", "Бухгалтерия"),
        "Платежное": ("Платежное поручение", "Бухгалтерия"),
        "Расчетный": ("Расчетный документ", "Бухгалтерия"),
        "financial_report": ("Отчет", "Бухгалтерия"),
        "Должностная": ("Должностная инструкция", "Отдел кадров"),
        "График": ("График отпусков", "Отдел кадров"),
        "Акт_проверки": ("Акт", "Отдел охраны труда"),
        "Правила_распорядка": ("Правила внутреннего распорядка", "Отдел охраны труда"),
        "План_развития": ("План", "Плановый отдел"),
        "Задание": ("Задание", "Плановый отдел"),
        "Годовой_отчет": ("Отчет", "Плановый отдел"),
        "Договор_аренды": ("Договор", "Юридический отдел"),
        "Доверенность": ("Доверенность", "Юридический отдел"),
        "Доп_соглашение": ("Дополнительное соглашение", "Юридический отдел"),

        # ОБЩИЙ ДОСТУП
        "Заявление": ("Заявление", "Общий отдел"),
        "Справка": ("Справка", "Общий отдел"),
        "Служебная": ("Служебная записка", "Общий отдел"),
        "Письмо": ("Письмо", "Общий отдел"),
        "Инструкция": ("Инструкция", "Общий отдел"),
        "Положение": ("Положение", "Общий отдел"),
        "Шаблон": ("Шаблон", "Общий отдел"),
        "Характеристика": ("Характеристика", "Общий отдел")
    }

    base_path = 'sample_docs'
    all_files = os.listdir(base_path)
    admin = db.query(models.User).filter(models.User.system_role == models.UserRole.ADMIN).first()

    for fname in all_files:
        fname = unicodedata.normalize('NFC', fname)
        found = False
        for key, (dtype, d_name) in mapping.items():
            if fname.startswith(key):
                dept = db.query(models.Department).filter(models.Department.name == d_name).first()
                if not dept: continue
                with open(os.path.join(base_path, fname), 'rb') as f:
                    text_content = file_processor.extract_text(f.read(), fname)
                    upsert_document(db, fname, text_content, dept.id, dtype, admin.id if admin else None)
                found = True
                break
        if not found:
            print(f"Пропущен файл (не в маппинге): {fname}")

    print("База знаний успешно наполнена.")

@app.on_event("startup")
async def startup_event():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_fts
            ON knowledge_base_chunks
            USING GIN (to_tsvector('russian', content_chunk));
        """))
        conn.commit()
    models.Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # 1. Отделы
        dept_names = ["Отдел делопроизводства", "Бухгалтерия", "Отдел кадров", "Отдел охраны труда", "Плановый отдел", "Юридический отдел", "Технический отдел", "Общий отдел"]
        for d_name in dept_names:
            if not db.query(models.Department).filter(models.Department.name == d_name).first():
                db.add(models.Department(name=d_name)); db.commit()

        # 2. Роли
        role_titles = ["CEO", "CTO", "CFO", "Head of Dept", "Team Lead", "PM", "Specialist", "Assistant", "Junior"]
        for title in role_titles:
            if not db.query(models.CompanyRole).filter(models.CompanyRole.title == title).first():
                db.add(models.CompanyRole(title=title, level="TOP" if title in ["CEO", "CTO", "CFO"] else "MIDDLE")); db.commit()

        # 3. Пользователи
        admin_pwd = os.getenv("INITIAL_ADMIN_PASSWORD")
        pwd = auth.get_password_hash(admin_pwd)
        users_raw = [
            ("GavrilovAA", "Гаврилов А.А.", "gavrilov@co.com", models.UserRole.ADMIN, "Технический отдел", "CEO"),
            ("IvanovII", "Иванов И.И.", "ivanov@co.com", models.UserRole.USER, "Бухгалтерия", "Specialist"),
            ("PetrovPP", "Петров П.П.", "petrov@co.com", models.UserRole.TECH_SPEC, "Технический отдел", "Team Lead"),
            ("SidorovSS", "Сидоров С.С.", "sidorov@co.com", models.UserRole.USER, "Отдел кадров", "Assistant"),
        ]
        for uname, full, email, s_role, d_name, r_title in users_raw:
            if not db.query(models.User).filter(models.User.username == uname).first():
                dept = db.query(models.Department).filter(models.Department.name == d_name).first()
                role = db.query(models.CompanyRole).filter(models.CompanyRole.title == r_title).first()
                u = models.User(username=uname, full_name=full, email=email, hashed_password=pwd,
                                system_role=s_role, department_id=dept.id, role_id=role.id)
                db.add(u); db.commit()

        # 4. Наполнение базы знаний файлами
        seed_knowledge_base(db)

# --- Endpoints ---

@app.post("/token", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    return {"access_token": auth.create_access_token({"sub": user.username}), "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def me(user: models.User = Depends(get_current_user)): return user

@app.post("/access/grant", response_model=schemas.AccessGrantResponse)
async def grant_access(data: schemas.AccessGrantCreate, db: Session = Depends(get_db), tech: models.User = Depends(get_tech_spec)):
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    grant = models.TemporaryAccess(user_id=data.user_id, target_department_id=data.target_department_id, access_password=otp, expires_at=datetime.utcnow() + timedelta(hours=data.duration_hours))
    db.add(grant); db.commit(); db.refresh(grant)
    return grant

@app.post("/kb/upload", response_model=schemas.KBItem)
async def upload(doc_type: str, target_department_id: Optional[int] = None, file: UploadFile = File(...), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    text_content = file_processor.extract_text(await file.read(), file.filename)
    dept_id = target_department_id if (target_department_id and user.system_role == models.UserRole.ADMIN) else user.department_id
    item = upsert_document(db, file.filename, text_content, dept_id, doc_type, user.id)
    return item

@app.post("/kb/search")
async def search(query: schemas.SearchQuery, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    # Всегда добавляем Общий отдел к списку разрешенных
    common_dept = db.query(models.Department).filter(models.Department.name == "Общий отдел").first()
    allowed_depts = [user.department_id]
    if common_dept:
        allowed_depts.append(common_dept.id)

    if query.access_password:
        access = db.query(models.TemporaryAccess).filter(
            models.TemporaryAccess.user_id == user.id,
            models.TemporaryAccess.access_password == query.access_password,
            models.TemporaryAccess.expires_at > datetime.utcnow(),
            models.TemporaryAccess.is_active == True
        ).first()
        if access: allowed_depts.append(access.target_department_id)

    if user.system_role == models.UserRole.ADMIN:
        all_depts = db.query(models.Department.id).all()
        allowed_depts = [d[0] for d in all_depts]

    results = await find_k(db, query.query, allowed_depts, query.limit)
    return results

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
