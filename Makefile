.PHONY: run-front run-back build-front build-back build run init

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
	# Copy frontend dist to backend
	mkdir -p backend/static
	cp -r frontend/dist/* backend/static/
	$(MAKE) build-back

# Run both frontend and backend concurrently
run:
	$(MAKE) run-back & $(MAKE) run-front
	# The trap ensures child processes are killed when this command is terminated
	trap 'kill $$(jobs -p)' INT TERM
