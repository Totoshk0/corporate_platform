from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import models
import schemas
from database import engine, get_db, SessionLocal
from embeddings import embedding_service

app = FastAPI(title="Corporate Knowledge Hub API")

@app.on_event("startup")
async def startup_event():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    models.Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.query(models.UserPosition).count() == 0:
            positions = [
                # Высший уровень
                models.UserPosition(title="CEO", level="TOP"),
                models.UserPosition(title="CTO", level="TOP"),
                models.UserPosition(title="CFO", level="TOP"),
                # Средний уровень
                models.UserPosition(title="Head of Department", level="MIDDLE"),
                models.UserPosition(title="Team Lead", level="MIDDLE"),
                models.UserPosition(title="Project Manager", level="MIDDLE"),
                # Нижний уровень
                models.UserPosition(title="Specialist", level="LOWER"),
                models.UserPosition(title="Assistant", level="LOWER"),
                models.UserPosition(title="Junior Specialist", level="LOWER"),
            ]
            db.add_all(positions)
            db.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Corporate Knowledge Hub API"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/positions", response_model=List[schemas.Position])
async def get_positions(db: Session = Depends(get_db)):
    return db.query(models.UserPosition).all()

# --- Knowledge Base Endpoints ---

@app.post("/kb/items", response_model=schemas.KBItem)
async def create_kb_item(item: schemas.KBItemCreate, db: Session = Depends(get_db)):
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
async def search_kb(query: schemas.SearchQuery, db: Session = Depends(get_db)):

    query_embedding = embedding_service.generate_embedding(query.query)

    # Семантический поиск с использованием косинусного расстояния
    # Мы выбираем сам объект и вычисляем расстояние до него
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
