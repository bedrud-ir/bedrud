.PHONY: help init dev dev-web dev-server dev-server-hot dev-api dev-livekit dev-ios dev-android dev-desktop dev-site build build-front build-back build-dist build-android-debug build-android install-android release-android build-ios export-ios build-ios-sim build-desktop build-site deploy test-back push-dev push-prod run-front-dev local-build local-run swagger-gen swagger-open scalar-open clean full-clean

GREEN  := \033[0;32m
RED    := \033[0;31m
RESET  := \033[0m

VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
LDFLAGS := -ldflags "-X main.version=$(VERSION)" -s -w

# Show available targets
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  init                 Install all dependencies (web + server + air)"
	@echo "  dev                  Run livekit + server + web concurrently"
	@echo "  dev-web              Run frontend dev server (proxies /api → :8090)"
	@echo "  dev-server           Run backend server + LiveKit"
	@echo "  dev-server-hot       Run backend with Air (hot reload on file changes)"
	@echo "  dev-api              Run backend only, no LiveKit (fast API iteration)"
	@echo "  dev-livekit          Run local LiveKit server"
	@echo "  dev-ios              Open iOS project in Xcode"
	@echo "  dev-android          Open Android project in Android Studio"
	@echo "  dev-site             Run Astro site dev server"
	@echo ""
	@echo "API Docs:"
	@echo "  swagger-gen          Regenerate Swagger docs from annotations (requires swag)"
	@echo "  swagger-open         Open Swagger UI in browser (http://localhost:8090/api/swagger)"
	@echo "  scalar-open          Open Scalar UI in browser (http://localhost:8090/api/scalar)"
	@echo ""
	@echo "Build:"
	@echo "  build                Build frontend + backend (embedded)"
	@echo "  build-front          Build frontend only"
	@echo "  build-back           Build backend only"
	@echo "  build-dist           Build production linux/amd64 tarball"
	@echo "  build-site           Build Astro site (SSG)"
	@echo ""
	@echo "Local (Single Binary):"
	@echo "  local-build          Build frontend+backend into one binary"
	@echo "  local-run            Build + run locally (SQLite, embedded LiveKit)"
	@echo ""
	@echo "Push/Deploy:"
	@echo "  push-dev             Build backend → deploy to BEDRUD-DEV (b.a16.at)"
	@echo "  push-prod            Build frontend+backend → deploy to BEDRUD-PROD (bedrud.xyz)"
	@echo ""
	@echo "Android:"
	@echo "  build-android-debug  Build debug APK"
	@echo "  build-android        Build release APK"
	@echo "  install-android      Install release APK on device"
	@echo "  release-android      Build + install release APK"
	@echo ""
	@echo "iOS:"
	@echo "  build-ios            Build iOS archive (Release)"
	@echo "  export-ios           Export IPA from archive"
	@echo "  build-ios-sim        Build for iOS Simulator (Debug)"
	@echo ""
	@echo "Desktop (Rust + Slint):"
	@echo "  dev-desktop          Build and run desktop app"
	@echo "  build-desktop        Build optimised release binary"
	@echo ""
	@echo "Test:"
	@echo "  test-back            Run backend tests"
	@echo ""
	@echo "Clean:"
	@echo "  clean                Remove build artifacts and binaries"
	@echo "  full-clean           Remove artifacts + installed dependencies (node_modules, gradle cache)"
	@echo ""


# Initialize all dependencies
init:
	@echo "➜ Setting up Bedrud development environment..."
	@# 1. Install LiveKit server binary if not in PATH
	@if ! command -v livekit-server >/dev/null 2>&1; then \
		echo "➜ Downloading LiveKit server..."; \
		ARCH=$$(uname -m); \
		if [ "$$ARCH" = "x86_64" ]; then LK_ARCH="amd64"; \
		elif [ "$$ARCH" = "aarch64" ]; then LK_ARCH="arm64"; \
		else echo "❌ Unsupported architecture: $$ARCH" && exit 1; fi; \
		curl -sL $$(curl -s https://api.github.com/repos/livekit/livekit/releases/latest | grep "browser_download_url.*linux_$${LK_ARCH}.tar.gz" | cut -d '"' -f 4) -o /tmp/livekit.tar.gz && \
		tar -xzf /tmp/livekit.tar.gz -C /tmp && \
		mkdir -p ~/.local/bin && \
		mv /tmp/livekit-server ~/.local/bin/ && \
		rm -f /tmp/livekit.tar.gz && \
		echo "✅ LiveKit server installed to ~/.local/bin/livekit-server"; \
	else \
		echo "✅ LiveKit server already installed"; \
	fi
	@# 2. Create backend config if missing
	@if [ ! -f server/config.yaml ]; then \
		cp server/config.local.yaml server/config.yaml; \
		echo "✅ Created server/config.yaml from local template"; \
	fi
	@# 3. Create LiveKit embed placeholder for Go compilation
	@mkdir -p server/internal/livekit/bin
	@test -f server/internal/livekit/bin/livekit-server || echo "placeholder" > server/internal/livekit/bin/livekit-server
	@# 4. Install air for hot reload if not present
	@if ! command -v air >/dev/null 2>&1; then \
		echo "➜ Installing air (Go hot reload)..."; \
		go install github.com/air-verse/air@latest; \
		echo "✅ air installed"; \
	else \
		echo "✅ air already installed"; \
	fi
	@# 5. Install frontend and backend dependencies
	cd apps/web && bun install
	cd apps/site && bun install
	cd server && go mod tidy && go mod download
	@echo "\n✅ Bedrud is ready! Run 'make dev' to start."

# Run livekit + server (hot reload) + web concurrently (Ctrl+C kills all)
dev:
	@trap 'kill 0' INT TERM; \
	$(MAKE) dev-livekit & \
	sleep 1; \
	$(MAKE) dev-server-hot & \
	$(MAKE) dev-web & \
	wait

# Run frontend development server
dev-web:
	cd apps/web && bun run dev

# Run backend server + LiveKit
dev-server:
	@trap 'kill 0' INT TERM; \
	$(MAKE) dev-livekit & \
	sleep 1; \
	cd server && go run ./cmd/server/main.go; \
	wait

# Run backend with Air hot reload (auto-restarts on .go file changes)
dev-server-hot:
	@if ! command -v air >/dev/null 2>&1; then \
		echo "❌ air not found. Run 'make init' to install it."; exit 1; \
	fi
	cd server && air

# Run backend only (no LiveKit) — fast iteration on API endpoints
dev-api:
	cd server && go run ./cmd/server/main.go

# Run local LiveKit server
dev-livekit:
	LIVEKIT_BIND_IP=0.0.0.0 livekit-server --config server/livekit.yaml --dev

# Open iOS project in Xcode
dev-ios:
	open apps/ios/Bedrud.xcodeproj

# Open Android project in Android Studio
dev-android:
	open -a "Android Studio" "$(CURDIR)/apps/android"

# Run Astro site dev server
dev-site:
	cd apps/site && bun run dev

# Build frontend
build-front:
	cd apps/web && bun run build

# Build backend
build-back:
	cd server && go build $(LDFLAGS) -o dist/bedrud ./cmd/bedrud/main.go

# Build both frontend and backend
build: build-front
	find server/frontend -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	mkdir -p server/frontend
	cp -r apps/web/dist/client/* server/frontend/
	@$(MAKE) build-back && \
		printf "$(GREEN)✅ Build succeeded: server/dist/bedrud$(RESET)\n" || \
		( printf "$(RED)❌ Build failed$(RESET)\n"; exit 1 )

# Build a production-ready compressed distribution
build-dist: build
	@mkdir -p dist
	@cd server && GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o ../dist/bedrud ./cmd/bedrud/main.go && \
		tar -cJf ../dist/bedrud_linux_amd64.tar.xz -C ../dist bedrud && \
		rm ../dist/bedrud && \
		printf "$(GREEN)✅ Distribution ready: dist/bedrud_linux_amd64.tar.xz$(RESET)\n" || \
		( printf "$(RED)❌ Distribution build failed$(RESET)\n"; exit 1 )

# Build Android debug APK
build-android-debug:
	cd apps/android && ./gradlew assembleDebug
	@echo "Debug APK: apps/android/app/build/outputs/apk/debug/app-debug.apk"

# Build Android release APK (requires keystore.properties)
build-android:
	cd apps/android && ./gradlew assembleRelease
	@echo "Release APK: apps/android/app/build/outputs/apk/release/app-release.apk"

# Install Android release APK on connected device
install-android:
	adb install apps/android/app/build/outputs/apk/release/app-release.apk

# Build + install Android release on device
release-android: build-android install-android

# Build iOS archive (Release)
build-ios:
	cd apps/ios && xcodebuild archive \
		-project Bedrud.xcodeproj \
		-scheme Bedrud \
		-configuration Release \
		-archivePath build/Bedrud.xcarchive \
		-destination "generic/platform=iOS" \
		CODE_SIGN_STYLE=Automatic
	@echo "Archive: apps/ios/build/Bedrud.xcarchive"

# Export iOS IPA from archive (requires ExportOptions.plist)
export-ios:
	cd apps/ios && xcodebuild -exportArchive \
		-archivePath build/Bedrud.xcarchive \
		-exportPath build/export \
		-exportOptionsPlist ExportOptions.plist
	@echo "IPA: apps/ios/build/export/Bedrud.ipa"

# Build and run desktop app (debug)
dev-desktop:
	cargo run -p bedrud-desktop

# Build optimised desktop release binary
build-desktop:
	cargo build -p bedrud-desktop --release

# Build Astro site (SSG)
build-site:
	cd apps/site && bun run build

# Build iOS for simulator (debug)
build-ios-sim:
	cd apps/ios && xcodebuild build \
		-project Bedrud.xcodeproj \
		-scheme Bedrud \
		-configuration Debug \
		-destination "platform=iOS Simulator,name=iPhone 17 Pro"

# Deploy using CLI tool
deploy:
	cd tools/cli && uv run python bedrud.py deploy $(ARGS)

# ---- API docs targets --------------------------------------------------------

# Regenerate Swagger docs from Go annotations (requires: go install github.com/swaggo/swag/cmd/swag@latest)
swagger-gen:
	@if ! command -v swag >/dev/null 2>&1; then \
		echo "❌ swag not found. Install with: go install github.com/swaggo/swag/cmd/swag@latest"; exit 1; \
	fi
	cd server && swag init -g cmd/server/main.go -o docs --parseDependency
	@echo "✅ Swagger docs regenerated in server/docs/"

# Open Swagger UI in browser (server must be running)
swagger-open:
	@open http://localhost:8090/api/swagger || xdg-open http://localhost:8090/api/swagger

# Open Scalar UI in browser (server must be running)
scalar-open:
	@open http://localhost:8090/api/scalar || xdg-open http://localhost:8090/api/scalar

# Run backend tests
test-back:
	cd server && go test -v -count=1 ./...

# Run frontend dev proxy
run-front-dev:
	@python3 $(CURDIR)/deploy/dev/dev_server.py

# ---- Push targets ------------------------------------------------------------

# Push backend-only to dev server (b.a16.at)
push-dev:
	@bash $(CURDIR)/deploy/push.sh dev

# Push frontend+backend to prod server (bedrud.xyz)
push-prod:
	@bash $(CURDIR)/deploy/push.sh prod

# ---- Local single-binary targets ---------------------------------------------

# Build a single binary with frontend embedded
local-build: build-front
	find server/frontend -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	mkdir -p server/frontend
	cp -r apps/web/dist/client/* server/frontend/
	@cd server && go build $(LDFLAGS) -o dist/bedrud ./cmd/bedrud/main.go && \
		printf "$(GREEN)✅ Single binary ready: server/dist/bedrud$(RESET)\n" || \
		( printf "$(RED)❌ Local build failed$(RESET)\n"; exit 1 )
	@echo "   Run with: CONFIG_PATH=server/config.local.yaml server/dist/bedrud run"

# Build and run the single binary locally (SQLite + embedded LiveKit)
local-run: local-build
	@echo "\n🚀 Starting Bedrud (single binary, SQLite, embedded LiveKit)..."
	@echo "   Open http://localhost:8090\n"
	CONFIG_PATH=$(CURDIR)/server/config.local.yaml $(CURDIR)/server/dist/bedrud run

# ---- Clean targets -----------------------------------------------------------

# Remove build artifacts and compiled binaries
clean:
	@echo "➜ Removing build artifacts..."
	@rm -rf dist/
	@rm -rf server/dist/
	@rm -rf apps/web/dist/
	@find server/frontend -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	@rm -rf apps/android/app/build/
	@rm -rf apps/ios/build/
	@rm -rf apps/site/dist/
	@rm -rf target/
	@echo "✅ Clean complete"

# Remove artifacts + installed dependencies (node_modules, gradle cache, go cache)
full-clean: clean
	@echo "➜ Removing installed dependencies..."
	@rm -rf apps/web/node_modules/
	@rm -rf apps/site/node_modules/
	@rm -rf apps/android/.gradle/
	@rm -rf apps/android/build/
	@cd server && go clean -modcache 2>/dev/null || true
	@echo "✅ Full clean complete (run 'make init' to reinstall dependencies)"