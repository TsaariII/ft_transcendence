DOCKER_COMPOSE_FILE := ./docker-compose.yml

dev:
	docker compose --profile dev -f docker-compose.yml up --build

# Target to create the custom network
#start-network:
#	@docker network inspect custom-network >/dev/null 2>&1 || docker network create inceptionnet
# Build the Docker images defined in the Dockerfile
build:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build -d

# Start services defined in docker-compose.yml added as fail safe to start network
up: #start-network
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

# Stop and remove services, cleanup
down:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

enter-nginx:
	docker exec -it nginx sh

enter-frontend:
	docker exec -it frontend sh

enter-backend:
	docker exec -it backend sh

# Show status of containers managed by docker-compose (only running)
ps:
	docker-compose -f $(DOCKER_COMPOSE_FILE) ps

# Restart all services
restart:
	docker-compose -f $(DOCKER_COMPOSE_FILE) restart


# View logs of the running services in real time
logs:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f 

# Clean dangling images and unused volumes
clean:
	docker system prune -f --volumes

# Remove all Docker volumes
clean-volumes:
	@echo "Removing all Docker volumes..."
	docker volume prune -f

# View logs for the Nginx service in real time
logs-nginx:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f nginx


# Full clean: includes `clean` and removes images and stopped containers
fclean: clean
	@echo "Removing all stopped containers..."
	docker container prune -f
	@echo "Removing all Docker images..."
	docker image prune -a -f

# Remove all Docker volumes including named volumes
fclean-volumes: fclean
	@echo "Removing all Docker volumes (including named volumes)..."
	docker volume rm -f $(docker volume ls -q)

# Clear logs
clear-logs:
	docker exec -it $(docker ps -q -f "name=nginx") sh -c 'cd /var/log/nginx && 

# Default target, builds and starts services, and shows status
all: build up ps

# Help message
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build	 - Build Docker images"
	@echo "  up		- Start Docker containers"
	@echo "  down	  - Stop Docker containers"
	@echo "  ps		- Show Docker containers status"
	@echo "  restart   - Restart Docker containers"
	@echo "  test	  - Run tests (if defined)"
	@echo "  logs	  - Show Docker containers logs"
	@echo "  clean	 - Remove dangling images and unused volumes"
	@echo "  logs-nginx - Show logs for Nginx service"
	@echo "  enter-backend - enter backend container"
	@echo "  enter-frontend - enter frontend container"
	@echo "  enter-nginx - enter nginx container"
	@echo "  fclean	- Full clean: remove all stopped containers and images"
	@echo "  all	   - Build, start, and show status of Docker containers"
	@echo "  help	  - Show this help message"

