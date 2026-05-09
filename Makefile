.PHONY: up down restart build logs ps clean help

# Переменные
PROJECT_NAME=corporate_platform

## Показать справку
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

## Запустить контейнеры в фоновом режиме
up:
	docker-compose -p $(PROJECT_NAME) up -d

## Остановить и удалить контейнеры
down:
	docker-compose -p $(PROJECT_NAME) down

## Перезапустить все сервисы
restart:
	docker-compose -p $(PROJECT_NAME) restart

## Пересобрать образы
build:
	docker-compose -p $(PROJECT_NAME) build

## Посмотреть логи backend-сервиса
logs:
	docker logs -f $(PROJECT_NAME)_backend

## Статус контейнеров
ps: ## Статус контейнеров
	docker-compose -p $(PROJECT_NAME) ps

## Запустить тесты ядра системы
test:
	docker exec $(PROJECT_NAME)_backend pytest tests/test_core.py

## Полная очистка
clean:
	docker-compose -p $(PROJECT_NAME) down -v --rmi all
	rm -rf data/postgres
