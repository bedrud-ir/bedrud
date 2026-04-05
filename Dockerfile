# syntax=docker/dockerfile:1.7
# ── Stage 1: Frontend ────────────────────────────────────────────────────────
FROM oven/bun:1 AS frontend
WORKDIR /app

# Install deps in a separate layer so source changes don't re-run install
COPY apps/web/package.json apps/web/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY apps/web/ ./
RUN bun run build

# ── Stage 2: Server binary ───────────────────────────────────────────────────
FROM golang:1.25-alpine AS backend
ARG TARGETARCH
ARG LIVEKIT_VERSION=1.10.1

RUN apk add --no-cache gcc musl-dev curl

WORKDIR /build/server

# Download Go modules in a separate cache layer
COPY server/go.mod server/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Download LiveKit binary (cached separately — only invalidates on version bump)
RUN --mount=type=cache,target=/tmp/lk-cache \
    LK_FILE="livekit_${LIVEKIT_VERSION}_linux_${TARGETARCH}.tar.gz" && \
    DEST="/tmp/lk-cache/${LK_FILE}" && \
    if [ ! -f "$DEST" ]; then \
      curl -fsSL "https://github.com/livekit/livekit/releases/download/v${LIVEKIT_VERSION}/${LK_FILE}" -o "$DEST"; \
    fi && \
    mkdir -p internal/livekit/bin && \
    tar -xzf "$DEST" -C internal/livekit/bin/ livekit-server && \
    chmod +x internal/livekit/bin/livekit-server

# Copy source and embedded frontend, then build
COPY server/ ./
COPY --from=frontend /app/dist/client ./frontend/

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=1 GOOS=linux \
    go build -ldflags="-s -w" -o /bedrud ./cmd/bedrud/main.go

# ── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /bedrud /usr/local/bin/bedrud
EXPOSE 8090 7880
ENTRYPOINT ["bedrud"]
CMD ["run"]
