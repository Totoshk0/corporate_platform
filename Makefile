.PHONY: up down restart build logs ps clean help prune

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
ps:
	docker-compose -p $(PROJECT_NAME) ps

## Запустить тесты
test:
	docker exec $(PROJECT_NAME)_backend pytest tests/

## Очистить неиспользуемые образы и контейнеры
prune:
	docker system prune -f

## Очистить базу знаний (удалить все документы)
clear-kb:
	docker exec -it corporate_platform_db psql -U user -d corporate_platform -c "TRUNCATE TABLE knowledge_base CASCADE;"

## Полная очистка
clean:
	docker-compose -p $(PROJECT_NAME) down -v --rmi all
	rm -rf data/postgres
