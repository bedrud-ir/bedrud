# syntax=docker/dockerfile:1.7
# ── Stage 0: Cross-compilation helper ────────────────────────────────────────
FROM --platform=$BUILDPLATFORM tonistiigi/xx:1.6.1 AS xx

# ── Stage 1: Frontend (build + embed) ───────────────────────────────────────
# embed.mjs expects to find scripts at apps/web/scripts/ and output to
# ../../server/frontend/, so we need the full source layout, not a flat /app.
FROM --platform=$BUILDPLATFORM oven/bun:1 AS frontend
WORKDIR /src/apps/web

# Install deps in a separate layer so source changes don't re-run install
COPY apps/web/package.json apps/web/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy everything embed.mjs and vite need
COPY apps/web/src/ ./src/
COPY apps/web/public/ ./public/
COPY apps/web/scripts/ ./scripts/
COPY apps/web/vite.config.ts apps/web/tsconfig.json apps/web/components.json ./

# build:embed runs vite build, spawns the SSR server briefly to capture the
# rendered HTML shell, then writes everything (assets + index.html + shell.html)
# to ../../server/frontend/. Pre-create that directory so the script's
# rmSync/mkdirSync don't fight a non-existent parent.
RUN mkdir -p /src/server/frontend && \
    bun run build:embed

# ── Stage 2: LiveKit binary (for target arch) ───────────────────────────────
FROM --platform=$BUILDPLATFORM alpine:3.21 AS livekit
ARG TARGETARCH
ARG LIVEKIT_VERSION=1.10.1
RUN apk add --no-cache curl && \
    LK_FILE="livekit_${LIVEKIT_VERSION}_linux_${TARGETARCH}.tar.gz" && \
    curl -fsSL "https://github.com/livekit/livekit/releases/download/v${LIVEKIT_VERSION}/${LK_FILE}" \
      -o "/tmp/${LK_FILE}" && \
    mkdir -p /out && \
    tar -xzf "/tmp/${LK_FILE}" -C /out/ livekit-server && \
    chmod +x /out/livekit-server

# ── Stage 3: Server binary (native cross-compilation via xx) ────────────────
FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS backend
COPY --from=xx / /
ARG TARGETPLATFORM

# Cross-compilation toolchain (runs on build platform, targets TARGETPLATFORM)
RUN apk add --no-cache clang lld
RUN xx-apk add --no-cache gcc musl-dev

WORKDIR /build/server

# Download Go modules in a separate cache layer
COPY server/go.mod server/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Copy server source then overlay rendered frontend from Stage 1
COPY server/ ./
COPY --from=frontend /src/server/frontend/ ./frontend/
COPY --from=livekit /out/livekit-server ./internal/livekit/bin/livekit-server

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=1 \
    xx-go build -ldflags="-s -w" -o /bedrud ./cmd/bedrud/main.go && \
    xx-verify /bedrud

# ── Stage 4: Runtime ────────────────────────────────────────────────────────
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /bedrud /usr/local/bin/bedrud
EXPOSE 8090 7880
ENTRYPOINT ["bedrud"]
CMD ["run"]
