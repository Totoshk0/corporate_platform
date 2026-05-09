from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from jose import JWTError, jwt
import models
import schemas
import auth
from database import engine, get_db, SessionLocal
from embeddings import embedding_service
from file_processor import file_processor

app = FastAPI(title="Corporate Knowledge Hub API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Authentication Dependencies ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.system_role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

@app.on_event("startup")
async def startup_event():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    models.Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.query(models.CompanyRole).count() == 0:
            roles = [
                models.CompanyRole(title="CEO", level="TOP"),
                models.CompanyRole(title="CTO", level="TOP"),
                models.CompanyRole(title="CFO", level="TOP"),
                models.CompanyRole(title="Head of Department", level="MIDDLE"),
                models.CompanyRole(title="Team Lead", level="MIDDLE"),
                models.CompanyRole(title="Project Manager", level="MIDDLE"),
                models.CompanyRole(title="Specialist", level="LOWER"),
                models.CompanyRole(title="Assistant", level="LOWER"),
                models.CompanyRole(title="Junior Specialist", level="LOWER"),
            ]
            db.add_all(roles)
            db.commit()

        # Сидирование пользователей
        default_password_hash = auth.get_password_hash("password123")
        users_data = [
            ("ceo_admin", "ceo@company.com", models.UserRole.ADMIN, 0),
            ("cto_admin", "cto@company.com", models.UserRole.ADMIN, 1),
            ("cfo_user", "cfo@company.com", models.UserRole.USER, 2),
            ("head_dept", "head@company.com", models.UserRole.USER, 3),
            ("team_lead", "lead@company.com", models.UserRole.USER, 4),
            ("pm_user", "pm@company.com", models.UserRole.USER, 5),
            ("specialist", "spec@company.com", models.UserRole.USER, 6),
            ("assistant", "asst@company.com", models.UserRole.USER, 7),
            ("junior", "junior@company.com", models.UserRole.USER, 8),
        ]
        all_roles = db.query(models.CompanyRole).order_by(models.CompanyRole.id).all()
        for username, email, sys_role, r_idx in users_data:
            if not db.query(models.User).filter(models.User.username == username).first():
                new_user = models.User(
                    username=username, email=email, hashed_password=default_password_hash,
                    system_role=sys_role, role_id=all_roles[r_idx].id
                )
                db.add(new_user)
        db.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users", response_model=List[schemas.User])
async def read_users(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    return db.query(models.User).all()

@app.post("/register", response_model=schemas.User)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = models.User(
        username=user.username, email=user.email, hashed_password=auth.get_password_hash(user.password),
        system_role=models.UserRole.USER, role_id=None
    )
    db.add(new_user)
    db.commit(); db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username}, expires_delta=auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

# --- Knowledge Base Endpoints ---

@app.post("/kb/upload", response_model=schemas.KBItem)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    content = await file.read()
    try:
        extracted_text = file_processor.extract_text(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    embedding = embedding_service.generate_embedding(extracted_text)
    db_item = models.KnowledgeBaseItem(title=file.filename, content=extracted_text, embedding=embedding)
    db.add(db_item)
    db.commit(); db.refresh(db_item)
    return db_item

@app.post("/kb/items", response_model=schemas.KBItem)
async def create_kb_item(
    item: schemas.KBItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    embedding = embedding_service.generate_embedding(item.content)
    db_item = models.KnowledgeBaseItem(
        title=item.title,
        content=item.content,
        embedding=embedding
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.post("/kb/search")
async def search_kb(query: schemas.SearchQuery, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query_embedding = embedding_service.generate_embedding(query.query)
    results = db.query(
        models.KnowledgeBaseItem,
        models.KnowledgeBaseItem.embedding.cosine_distance(query_embedding).label("distance")
    ).order_by(
        text("distance")
        ).limit(query.limit).all()
    return [
        {
            "id": item.id,
            "title": item.title,
            "content": item.content,
            "created_at": item.created_at,
            "distance": float(distance)
            } for item, distance in results
    ]
