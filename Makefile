.PHONY: help init dev dev-web dev-server dev-livekit dev-ios dev-android build build-front build-back build-dist build-android-debug build-android install-android release-android build-ios export-ios build-ios-sim deploy test-back push-dev push-prod run-front-dev local-build local-run

# Show available targets
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  init                 Install all dependencies (web + server)"
	@echo "  dev                  Run livekit + server + web concurrently"
	@echo "  dev-web              Run frontend dev server"
	@echo "  dev-server           Run backend server"
	@echo "  dev-livekit          Run local LiveKit server"
	@echo "  dev-ios              Open iOS project in Xcode"
	@echo "  dev-android          Open Android project in Android Studio"
	@echo ""
	@echo "Build:"
	@echo "  build                Build frontend + backend (embedded)"
	@echo "  build-front          Build frontend only"
	@echo "  build-back           Build backend only"
	@echo "  build-dist           Build production linux/amd64 tarball"
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
	@echo "Test:"
	@echo "  test-back            Run backend tests"
	@echo ""
	@echo "Documentation:"
	@echo "  doc                  Build MkDocs documentation"
	@echo "  doc-serve            Serve MkDocs documentation locally"

# Initialize all dependencies
init:
	cd apps/web && bun install
	cd server && go mod tidy && go mod download

# Run livekit + server + web concurrently (Ctrl+C kills all)
dev:
	@trap 'kill 0' INT TERM; \
	$(MAKE) dev-livekit & \
	sleep 1; \
	$(MAKE) dev-server & \
	$(MAKE) dev-web & \
	wait

# Run frontend development server
dev-web:
	cd apps/web && bun run dev

# Run backend server
dev-server:
	cd server && go run ./cmd/server/main.go

# Run local LiveKit server
dev-livekit:
	livekit-server --config server/livekit.yaml --dev

# Open iOS project in Xcode
dev-ios:
	open apps/ios/Bedrud.xcodeproj

# Open Android project in Android Studio
dev-android:
	open -a "Android Studio" "$(CURDIR)/apps/android"

# Build frontend
build-front:
	cd apps/web && bun run build

# Build backend
build-back:
	cd server && go build -o dist/bedrud ./cmd/bedrud/main.go

# Build both frontend and backend
build: build-front
	find server/frontend -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	mkdir -p server/frontend
	cp -r apps/web/build/* server/frontend/
	$(MAKE) build-back

# Build a production-ready compressed distribution
build-dist: build
	@echo "Building production binary (linux/amd64)..."
	@mkdir -p dist
	@cd server && GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../dist/bedrud ./cmd/bedrud/main.go
	@echo "Creating compressed archive..."
	@tar -cJf dist/bedrud_linux_amd64.tar.xz -C dist bedrud
	@rm dist/bedrud
	@echo "Distribution ready: dist/bedrud_linux_amd64.tar.xz"

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

# Build iOS for simulator (debug)
build-ios-sim:
	cd apps/ios && xcodebuild build \
		-project Bedrud.xcodeproj \
		-scheme Bedrud \
		-configuration Debug \
		-destination "platform=iOS Simulator,name=iPhone 17 Pro"

# Documentation:
doc:
	cd tools/cli && uv run python bedrud.py doc build

doc-serve:
	cd tools/cli && uv run python bedrud.py doc serve

# Deploy using CLI tool
deploy:
	cd tools/cli && uv run python bedrud.py deploy $(ARGS)

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
	cp -r apps/web/build/* server/frontend/
	cd server && go build -o dist/bedrud ./cmd/bedrud/main.go
	@echo "\n✅ Single binary ready: server/dist/bedrud"
	@echo "   Run with: CONFIG_PATH=server/config.local.yaml server/dist/bedrud run"

# Build and run the single binary locally (SQLite + embedded LiveKit)
local-run: local-build
	@echo "\n🚀 Starting Bedrud (single binary, SQLite, embedded LiveKit)..."
	@echo "   Open http://localhost:8090\n"
	CONFIG_PATH=$(CURDIR)/server/config.local.yaml $(CURDIR)/server/dist/bedrud run