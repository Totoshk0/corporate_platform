import pytest
import requests
import time

API_URL = "http://127.0.0.1:8000"

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

def test_full_auth_flow():
    assert wait_for_api()
    """Тест регистрации, входа и доступа к защищенному эндпоинту"""

    # 1. Регистрация
    username = "testuser_auth"
    user_data = {
        "username": username,
        "email": "auth@example.com",
        "password": "strongpassword",
        "role": "user"
    }
    # Очистка если пользователь уже есть (для повторяемости тестов)
    # В реальных тестах лучше использовать отдельную БД

    resp_reg = requests.post(f"{API_URL}/register", json=user_data)
    if resp_reg.status_code == 400: # Уже есть
        pass
    else:
        assert resp_reg.status_code == 200

    # 2. Логин
    login_data = {
        "username": username,
        "password": "strongpassword"
    }
    resp_login = requests.post(f"{API_URL}/token", data=login_data)
    assert resp_login.status_code == 200
    token = resp_login.json()["access_token"]
    assert token is not None

    # 3. Доступ к /users/me
    headers = {"Authorization": f"Bearer {token}"}
    resp_me = requests.get(f"{API_URL}/users/me", headers=headers)
    assert resp_me.status_code == 200
    assert resp_me.json()["username"] == username

def test_unauthorized_access():
    """Проверка запрета доступа без токена"""
    resp = requests.get(f"{API_URL}/users/me")
    assert resp.status_code == 401
