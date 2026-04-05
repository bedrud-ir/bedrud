# Stage 1: Build frontend
FROM node:22-alpine AS frontend
RUN npm install -g bun
WORKDIR /build/apps/web
COPY apps/web/package.json apps/web/bun.lock ./
RUN bun install --frozen-lockfile
COPY apps/web/ ./
RUN bun run build

# Stage 2: Build Go server with embedded frontend
FROM golang:1.24-alpine AS backend
ARG TARGETARCH
ARG LIVEKIT_VERSION=1.10.1
RUN apk add --no-cache gcc musl-dev curl
WORKDIR /build/server
COPY server/go.mod server/go.sum ./
RUN go mod download
RUN mkdir -p internal/livekit/bin && \
    curl -fsSL "https://github.com/livekit/livekit/releases/download/v${LIVEKIT_VERSION}/livekit_${LIVEKIT_VERSION}_linux_${TARGETARCH}.tar.gz" -o /tmp/lk.tar.gz && \
    tar -xzf /tmp/lk.tar.gz -C internal/livekit/bin/ livekit-server && \
    chmod +x internal/livekit/bin/livekit-server && \
    rm /tmp/lk.tar.gz
COPY server/ ./
COPY --from=frontend /build/apps/web/build ./frontend/
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o /bedrud ./cmd/bedrud/main.go

# Stage 3: Minimal runtime image
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /bedrud /usr/local/bin/bedrud
EXPOSE 8090 7880
ENTRYPOINT ["bedrud"]
CMD ["run"]
