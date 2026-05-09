import pytest
import requests
import time
from sqlalchemy import create_engine, text

# Внутри контейнера база доступна по имени сервиса 'db'
DATABASE_URL = "postgresql://user:password@db:5432/corporate_platform"
# API доступно по localhost внутри того же контейнера
API_URL = "http://localhost:8000"

def test_db_connection():
    """Проверка доступности базы данных и наличия расширения vector"""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        assert result == 1

        # Проверка расширения pgvector
        vector_ext = conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'")).scalar()
        assert vector_ext == 'vector'

def test_api_health():
    """Проверка доступности API"""
    response = requests.get(f"{API_URL}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_positions_seeded():
    """Проверка, что должности были созданы при старте"""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM positions")).scalar()
        assert count == 9

def test_embedding_model():
    """Проверка работоспособности модели эмбеддингов через поиск"""
    # Тестовый документ
    doc = {"title": "Test AI", "content": "Artificial Intelligence is the future."}
    requests.post(f"{API_URL}/kb/items", json=doc)

    # Ищем его
    search = {"query": "AI future", "limit": 1}
    response = requests.post(f"{API_URL}/kb/search", json=search)
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert "Test AI" in results[0]["title"]
    assert results[0]["distance"] < 0.5 # Релевантный результат должен иметь малую дистанцию
