import pytest
import requests
import time
from sqlalchemy import create_engine, text

# Внутри контейнера база доступна по имени сервиса 'db'
DATABASE_URL = "postgresql://user:password@db:5432/corporate_platform"
# API доступно по localhost внутри того же контейнера
API_URL = "http://127.0.0.1:8000"

def test_db_connection():
    """Проверка доступности базы данных и наличия расширения vector"""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        assert result == 1

        # Проверка расширения pgvector
        vector_ext = conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'")).scalar()
        assert vector_ext == 'vector'

def wait_for_api():
    for _ in range(15):
        try:
            resp = requests.get(f"{API_URL}/health")
            if resp.status_code == 200:
                return True
        except:
            pass
        time.sleep(2)
    return False

def test_api_health():
    """Проверка доступности API"""
    assert wait_for_api()
    response = requests.get(f"{API_URL}/health")
    assert response.status_code == 200

def test_positions_seeded():
    """Проверка, что должности были созданы при старте"""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM company_roles")).scalar()
        assert count == 9

def test_embedding_model():
    """Проверка работоспособности модели эмбеддингов через поиск (требует Auth)"""
    # 1. Регистрация и логин для теста
    user_data = {"username": "core_test_user", "email": "core@test.com", "password": "pass", "role": "user"}
    requests.post(f"{API_URL}/register", json=user_data)
    login_resp = requests.post(f"{API_URL}/token", data={"username": "core_test_user", "password": "pass"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Добавляем тестовый документ
    doc = {"title": "Test AI", "content": "Artificial Intelligence is the future."}
    create_resp = requests.post(f"{API_URL}/kb/items", json=doc, headers=headers)
    assert create_resp.status_code == 200

    # 3. Ищем его
    search = {"query": "AI future", "limit": 1}
    response = requests.post(f"{API_URL}/kb/search", json=search, headers=headers)
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert "Test AI" in results[0]["title"]
