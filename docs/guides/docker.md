# Docker

Bedrud provides a multi-stage Dockerfile for building and running in containers.

## Quick Start

```bash
# Build
docker build -t bedrud .

# Run
docker run -d --name bedrud -p 8090:8090 -p 7880:7880 bedrud
```

## Dockerfile Overview

The Dockerfile uses three stages to minimize the final image size:

### Stage 1: Frontend Build

```dockerfile
FROM node:22-alpine AS frontend
RUN npm install -g bun
WORKDIR /build/apps/web
COPY apps/web/package.json apps/web/bun.lock ./
RUN bun install --frozen-lockfile
COPY apps/web/ ./
RUN bun run build
```

Installs Bun, builds the Svelte frontend to static files.

### Stage 2: Server Build

```dockerfile
FROM golang:1.24-alpine AS backend
RUN apk add --no-cache gcc musl-dev
WORKDIR /build/server
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
COPY --from=frontend /build/apps/web/build ./frontend/
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o /bedrud ./cmd/bedrud/main.go
```

Compiles the Go binary with the frontend embedded. CGO is enabled for SQLite support.

### Stage 3: Runtime

```dockerfile
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /bedrud /usr/local/bin/bedrud
EXPOSE 8090 7880
ENTRYPOINT ["bedrud"]
CMD ["run"]
```

Minimal Alpine image with just the binary, CA certificates, and timezone data.

## Ports

| Port | Service | Protocol |
|------|---------|----------|
| 8090 | API + Web UI | HTTP |
| 7880 | LiveKit | WebSocket + HTTP |

For LiveKit media streams, you may also need to expose the RTC UDP port range (default: 50000-60000).

## Volumes

Mount a volume for persistent data:

```bash
docker run -d \
  --name bedrud \
  -p 8090:8090 \
  -p 7880:7880 \
  -v bedrud-data:/var/lib/bedrud \
  bedrud
```

## Configuration

Pass a custom configuration file:

```bash
docker run -d \
  --name bedrud \
  -p 8090:8090 \
  -p 7880:7880 \
  -v /path/to/config.yaml:/etc/bedrud/config.yaml \
  -v bedrud-data:/var/lib/bedrud \
  bedrud run --config /etc/bedrud/config.yaml
```

Or use environment variables:

```bash
docker run -d \
  --name bedrud \
  -p 8090:8090 \
  -p 7880:7880 \
  -e AUTH_JWT_SECRET=my-production-secret \
  -e LIVEKIT_API_KEY=prodkey \
  -e LIVEKIT_API_SECRET=prodsecret \
  bedrud
```

## Pre-built Images

Docker images are published to GitHub Container Registry on every release:

```bash
# Latest release
docker pull ghcr.io/bedrud-ir/bedrud:latest

# Specific version
docker pull ghcr.io/bedrud-ir/bedrud:v1.0.0
```

## Docker Compose Example

```yaml
services:
  bedrud:
    image: ghcr.io/bedrud-ir/bedrud:latest
    ports:
      - "8090:8090"
      - "7880:7880"
    volumes:
      - bedrud-data:/var/lib/bedrud
      - ./config.yaml:/etc/bedrud/config.yaml
    environment:
      - AUTH_JWT_SECRET=change-me
    restart: unless-stopped

volumes:
  bedrud-data:
```
