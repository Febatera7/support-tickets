.PHONY: start stop restart build build-backend build-frontend logs logs-api logs-worker logs-frontend status clean help

BACKEND  = docker compose -f backend/docker-compose.yml
FRONTEND = docker compose -f frontend/docker-compose.yml

help:
	@echo ""
	@echo "  make build            Build all images"
	@echo "  make build-backend    Build backend image only"
	@echo "  make build-frontend   Build frontend image only"
	@echo "  make start            Start all (without rebuilding)"
	@echo "  make stop             Stop containers (keep data)"
	@echo "  make restart          Stop and start again"
	@echo "  make logs             Stream all logs"
	@echo "  make logs-api         Stream API logs"
	@echo "  make logs-worker      Stream worker logs"
	@echo "  make logs-frontend    Stream frontend logs"
	@echo "  make status           Show running containers"
	@echo "  make clean            Remove containers AND all data"
	@echo ""

build: build-backend build-frontend

build-backend:
	$(BACKEND) build

build-frontend:
	$(FRONTEND) build

start:
	@echo "Starting backend..."
	$(BACKEND) up -d --wait
	@echo "Starting frontend..."
	$(FRONTEND) up -d --wait
	@echo ""
	@echo "All services are up."
	@echo "  App:      http://localhost:3000"
	@echo "  API:      http://localhost:4000"
	@echo "  Keycloak: http://localhost:8080"
	@echo ""

stop:
	@echo "Stopping services (data preserved)..."
	$(FRONTEND) stop
	$(BACKEND) stop
	@echo "Done."

restart: stop start

logs:
	$(BACKEND) logs -f & $(FRONTEND) logs -f

logs-api:
	$(BACKEND) logs -f api

logs-worker:
	$(BACKEND) logs -f worker

logs-frontend:
	$(FRONTEND) logs -f frontend

status:
	$(BACKEND) ps
	$(FRONTEND) ps

clean:
	@echo "WARNING: This will permanently delete all data."
	$(FRONTEND) down
	$(BACKEND) down -v
	@echo "All data removed."