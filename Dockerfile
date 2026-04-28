# syntax=docker/dockerfile:1.7
# ── Stage 0: Cross-compilation helper ────────────────────────────────────────
FROM --platform=$BUILDPLATFORM tonistiigi/xx:1.6.1 AS xx

# ── Stage 1: Frontend (platform-independent) ────────────────────────────────
FROM --platform=$BUILDPLATFORM oven/bun:1 AS frontend
WORKDIR /app

# Install deps in a separate layer so source changes don't re-run install
COPY apps/web/package.json apps/web/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy only what the Vite build needs (not tests, docs, scripts)
COPY apps/web/src/ ./src/
COPY apps/web/public/ ./public/
COPY apps/web/vite.config.ts apps/web/tsconfig.json apps/web/components.json ./
RUN bun run build

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
ARG VERSION=dev

# Install cross-compilation toolchain (runs on build platform, targets TARGETPLATFORM)
RUN apk add --no-cache clang lld
RUN xx-apk add --no-cache gcc musl-dev

WORKDIR /build/server

# Download Go modules in a separate cache layer
COPY server/go.mod server/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Copy source and embedded assets, then cross-compile
COPY server/ ./
COPY --from=frontend /app/dist/client ./frontend/
COPY --from=livekit /out/livekit-server ./internal/livekit/bin/livekit-server

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=1 \
    xx-go build -ldflags="-s -w -X main.version=${VERSION}" -o /bedrud ./cmd/bedrud/main.go && \
    xx-verify /bedrud

# ── Stage 4: Runtime ────────────────────────────────────────────────────────
FROM alpine:3.21
ARG VERSION=dev
LABEL org.opencontainers.image.version="${VERSION}"
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /bedrud /usr/local/bin/bedrud
EXPOSE 8090 7880
ENTRYPOINT ["bedrud"]
CMD ["run"]
