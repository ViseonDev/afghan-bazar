# Afghanistan Marketplace - Docker Commands

# Development commands
.PHONY: dev
dev:
	docker-compose -f docker-compose.dev.yml up --build

.PHONY: dev-down
dev-down:
	docker-compose -f docker-compose.dev.yml down

.PHONY: dev-logs
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

.PHONY: dev-clean
dev-clean:
	docker-compose -f docker-compose.dev.yml down -v --rmi all

# Production commands
.PHONY: prod
prod:
	docker-compose up --build -d

.PHONY: prod-down
prod-down:
	docker-compose down

.PHONY: prod-logs
prod-logs:
	docker-compose logs -f

.PHONY: prod-clean
prod-clean:
	docker-compose down -v --rmi all

# Database commands
.PHONY: db-backup
db-backup:
	docker-compose exec mongo mongodump --out /data/backup/$(shell date +%Y%m%d_%H%M%S)

.PHONY: db-restore
db-restore:
	@echo "Usage: make db-restore BACKUP_DIR=20231201_120000"
	@if [ -z "$(BACKUP_DIR)" ]; then echo "Please specify BACKUP_DIR"; exit 1; fi
	docker-compose exec mongo mongorestore /data/backup/$(BACKUP_DIR)

# Utility commands
.PHONY: shell-api
shell-api:
	docker-compose exec api sh

.PHONY: shell-app
shell-app:
	docker-compose exec app sh

.PHONY: shell-mongo
shell-mongo:
	docker-compose exec mongo mongosh

.PHONY: shell-redis
shell-redis:
	docker-compose exec redis redis-cli

.PHONY: logs-api
logs-api:
	docker-compose logs -f api

.PHONY: logs-app
logs-app:
	docker-compose logs -f app

.PHONY: setup-ssl
setup-ssl:
	mkdir -p ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ssl/key.pem \
		-out ssl/cert.pem \
		-subj "/C=AF/ST=Kabul/L=Kabul/O=Afghan Bazar/OU=IT/CN=localhost"

.PHONY: health-check
health-check:
	@echo "Checking API health..."
	@curl -f http://localhost:4000/health || echo "API is down"
	@echo "Checking App health..."
	@curl -f http://localhost:19006 || echo "App is down"

.PHONY: help
help:
	@echo "Afghanistan Marketplace - Available commands:"
	@echo "  dev         - Start development environment"
	@echo "  dev-down    - Stop development environment"
	@echo "  dev-logs    - View development logs"
	@echo "  dev-clean   - Clean development environment"
	@echo "  prod        - Start production environment"
	@echo "  prod-down   - Stop production environment"
	@echo "  prod-logs   - View production logs"
	@echo "  prod-clean  - Clean production environment"
	@echo "  db-backup   - Backup database"
	@echo "  db-restore  - Restore database (specify BACKUP_DIR)"
	@echo "  shell-api   - Access API container shell"
	@echo "  shell-app   - Access App container shell"
	@echo "  shell-mongo - Access MongoDB shell"
	@echo "  shell-redis - Access Redis shell"
	@echo "  setup-ssl   - Generate self-signed SSL certificates"
	@echo "  health-check - Check if services are running"
	@echo "  help        - Show this help message"