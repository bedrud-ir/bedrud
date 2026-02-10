# Makefile Guide

This file helps you run and build the Bedrud project easily. It has commands for both the backend and frontend.

## Common Commands

### 1. Initialize Project
To install all needed packages for frontend and backend, run:
```bash
make init
```

### 2. Development
To run both the backend and frontend at the same time for development:
```bash
make run
```
*   The frontend usually runs on [http://localhost:5173](http://localhost:5173).
*   The backend usually runs on [http://localhost:3000](http://localhost:3000).

You can also run them separately:
*   **Backend only:** `make run-back`
*   **Frontend only:** `make run-front`

### 3. Build for Production
To build the whole project for production:
```bash
make build
```
This command builds the frontend, copies it to the backend folder, and then builds the backend binary.

### 4. Deployment
If you are deploying to the BEDRUD server:
*   **Full deploy:** `make deploy` (runs the deployment script)
*   **Quick update:** `make push` (only updates the backend binary)

### 5. Docker (Infrastructure)
The project uses Docker for services like the database (Postgres), Redis, and LiveKit.
*   **Start services:** `make docker-dev-up`
*   **Stop services:** `make docker-dev-down`
*   **View logs:** `make docker-dev-logs`
