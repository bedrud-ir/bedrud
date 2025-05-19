.PHONY: run-front run-back build-front build-back build run init docker-dev-up docker-dev-down docker-dev-pull

# Initialize project dependencies
init:
	cd frontend && npm install
	cd backend && go mod tidy && go mod download

# Run frontend development server
run-front:
	cd frontend && npm run dev

# Run backend server
run-back:
	cd backend && go run ./cmd/server/main.go

# Build frontend
build-front:
	cd frontend && npm run build

# Build backend
build-back:
	cd backend && go build -o dist/bedrud ./cmd/server/main.go

# Build both frontend and backend
build: build-front
	# Clean backend frontend directory
	rm -rf backend/frontend
	# Create backend/frontend directory
	mkdir -p backend/frontend
	# Copy frontend build to backend
	cp -r frontend/build/* backend/frontend/
	$(MAKE) build-back

# Run both frontend and backend concurrently
run:
	$(MAKE) run-back & $(MAKE) run-front
	# The trap ensures child processes are killed when this command is terminated
	trap 'kill $$(jobs -p)' INT TERM

# Docker development targets
docker-dev-up:
	docker compose -f deploy/dev/docker-compose.yaml up -d

docker-dev-down:
	docker compose -f deploy/dev/docker-compose.yaml down

docker-dev-pull:
	docker compose -f deploy/dev/docker-compose.yaml pull

docker-dev-logs:
	docker compose -f deploy/dev/docker-compose.yaml logs -f

docker-dev-ps:
	docker compose -f deploy/dev/docker-compose.yaml ps
