#!/usr/bin/env bash
# bedrud installer — curl -fsSL https://get.bedrud.org | bash
set -euo pipefail

BINARY_NAME="bedrud"
REPO="${BEDRUD_REPO:-bedrud-ir/bedrud}"
if [[ "$(id -u)" -eq 0 ]]; then
  INSTALL_DIR="${BEDRUD_INSTALL:-/usr/local/bin}"
else
  INSTALL_DIR="${BEDRUD_INSTALL:-$HOME/.local/bin}"
fi
VERSION="latest"
BUILD=false
BRANCH="main"
SKIP_SHELL=false
NO_SETUP=false
CONFIG_FILE="/etc/bedrud/config.yaml"

# ── Colors (tty only) ───────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  DIM='\033[2m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' BOLD='' DIM='' RESET=''
fi

info()  { printf "${GREEN}info${RESET}  %s\n" "$*" ; }
warn()  { printf "${YELLOW}warn${RESET}  %s\n" "$*" ; }
error() { printf "${RED}error${RESET} %s\n" "$*" >&2; exit 1 ; }
step()  { printf "\n${BLUE}${BOLD}── %s ──${RESET}\n" "$*" ; }

ask() {
  local prompt="$1" default="${2:-}" var="$3" is_secret="${4:-false}"
  if [[ "$is_secret" == "true" ]]; then
    if [[ -n "$default" ]]; then
      printf "${BOLD}%s [****]:${RESET} " "$prompt"
    else
      printf "${BOLD}%s:${RESET} " "$prompt"
    fi
    read -rs "$var" </dev/tty || true
    echo ""
    if [[ -z "${!var}" && -n "$default" ]]; then
      eval "$var=\"$default\""
    fi
  else
    if [[ -n "$default" ]]; then
      printf "${BOLD}%s [%s]:${RESET} " "$prompt" "$default"
    else
      printf "${BOLD}%s:${RESET} " "$prompt"
    fi
    read -r "$var" </dev/tty || true
    if [[ -z "${!var}" && -n "$default" ]]; then
      eval "$var=\"$default\""
    fi
  fi
}

ask_yn() {
  local prompt="$1" default="${2:-Y}" var="$3"
  if [[ "$default" == "Y" ]]; then
    printf "${BOLD}%s [Y/n]:${RESET} " "$prompt"
  else
    printf "${BOLD}%s [y/N]:${RESET} " "$prompt"
  fi
  read -r answer </dev/tty || true
  answer="${answer:-$default}"
  case "${answer,,}" in
    y|yes) eval "$var=true" ;;
    n|no)  eval "$var=false" ;;
    *)     eval "$var=$( [[ '$default' == 'Y' ]] && echo true || echo false )" ;;
  esac
}

ask_pg_details() {
  warn "Ensure Postgres is not publicly accessible (bind to 127.0.0.1 or private network)."
  echo ""
  ask "Postgres host" "127.0.0.1" PG_HOST
  ask "Postgres port" "5432" PG_PORT
  ask "Postgres user" "bedrud" PG_USER
  ask "Postgres database" "bedrud" PG_DBNAME
  ask "Postgres password" "" PG_PASS_RAW
  PG_PASS="$PG_PASS_RAW"
}

# ── Windows guard ────────────────────────────────────────────────
case "$(uname -s 2>/dev/null)" in
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    echo "Windows detected. Run this in PowerShell instead:"
    echo ""
    echo '  irm https://get.bedrud.org/install.ps1 | iex'
    echo ""
    echo "Or download from: https://github.com/${REPO}/releases/latest"
    exit 1
    ;;
esac

# ── Dependency checks ───────────────────────────────────────────
command -v curl >/dev/null 2>&1 || error "curl is required (https://curl.se)"
command -v tar >/dev/null 2>&1 || error "tar is required"

if [[ "$BUILD" == true ]]; then
  command -v git >/dev/null 2>&1 || error "git is required for --build mode"
  command -v make >/dev/null 2>&1 || error "make is required for --build mode"
fi

# ── Arg parse ───────────────────────────────────────────────────
usage() {
  cat <<EOF
${BOLD}bedrud installer${RESET}

Usage: curl -fsSL https://get.bedrud.org | bash -s -- [options]

Options:
  --install-dir <dir>   Install directory (default: ~/.local/bin, /usr/local/bin if root)
  --version <ver>       Install specific version (default: latest)
  --build               Build from source instead of downloading a release
  --branch <name>       Git branch to clone (default: main, requires --build)
  --skip-shell          Skip shell RC / PATH modification
  --no-setup            Download only, skip interactive server setup
  -h, --help            Show this help

Environment:
  BEDRUD_INSTALL        Override install directory
  BEDRUD_REPO           Override GitHub repo (default: bedrud-ir/bedrud)

Examples:
  curl -fsSL https://get.bedrud.org | bash
  curl -fsSL https://get.bedrud.org | bash -s -- --version v1.2.0
  curl -fsSL https://get.bedrud.org | bash -s -- --install-dir /usr/local/bin
  curl -fsSL https://get.bedrud.org | bash -s -- --build --branch my-feature
  BEDRUD_REPO=myuser/bedrud curl -fsSL https://get.bedrud.org | bash -s -- --build
  curl -fsSL https://get.bedrud.org | bash -s -- --no-setup
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    --version)     VERSION="$2"; shift 2 ;;
    --build)       BUILD=true; shift ;;
    --branch)      BRANCH="$2"; shift 2 ;;
    --skip-shell)  SKIP_SHELL=true; shift ;;
    --no-setup)    NO_SETUP=true; shift ;;
    -h|--help)     usage ;;
    *) error "Unknown argument: $1. Run with --help for usage." ;;
  esac
done

# ── Platform detection ──────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) os="darwin" ;;
  Linux)  os="linux" ;;
  FreeBSD) os="freebsd" ;;
  *) error "Unsupported OS: $OS" ;;
esac

case "$ARCH" in
  x86_64|amd64)         arch="amd64" ;;
  aarch64|arm64)        arch="arm64" ;;
  armv7l|armv7)         arch="armv7" ;;
  *) error "Unsupported architecture: $ARCH" ;;
esac

TARGET="${os}_${arch}"

# Rosetta 2 -> native ARM
if [[ "$os" == "darwin" ]] && [[ "$arch" == "amd64" ]]; then
  if sysctl -n sysctl.proc_translated 2>/dev/null | grep -q "1"; then
    TARGET="darwin_arm64"
    info "Rosetta 2 detected — using native ARM binary"
  fi
fi

# ── Construct download URL ──────────────────────────────────────
GITHUB="https://github.com"
if [[ "$VERSION" == "latest" ]]; then
  RELEASE_URL="${GITHUB}/${REPO}/releases/latest/download"
else
  RELEASE_URL="${GITHUB}/${REPO}/releases/download/${VERSION}"
fi

info "Target: ${TARGET}"

# ── Temp dir with cleanup trap ──────────────────────────────────
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# ── Download ────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"

EXISTING_BIN="$(command -v bedrud 2>/dev/null || true)"
EXISTING_AT_TARGET=""
if [[ -z "$EXISTING_BIN" && -x "${INSTALL_DIR}/${BINARY_NAME}" ]]; then
  EXISTING_AT_TARGET="${INSTALL_DIR}/${BINARY_NAME}"
fi

if [[ -n "$EXISTING_BIN" ]]; then
  warn "bedrud already installed at ${EXISTING_BIN}"
  if [[ -t 0 && -t 1 ]]; then
    ask_yn "Reinstall / overwrite?" "Y" DO_OVERWRITE
    if [[ "$DO_OVERWRITE" != true ]]; then
      info "Keeping existing binary. Skipping download."
      SKIP_DOWNLOAD=true
    fi
  fi
elif [[ -n "$EXISTING_AT_TARGET" ]]; then
  warn "bedrud binary found at ${EXISTING_AT_TARGET} (not in PATH)"
  if [[ -t 0 && -t 1 ]]; then
    ask_yn "Overwrite existing binary?" "Y" DO_OVERWRITE
    if [[ "$DO_OVERWRITE" != true ]]; then
      info "Keeping existing binary. Skipping download."
      SKIP_DOWNLOAD=true
    fi
  fi
fi

SKIP_DOWNLOAD="${SKIP_DOWNLOAD:-false}"

if [[ "$SKIP_DOWNLOAD" != true ]]; then
  if [[ "$BUILD" == true ]]; then
    # ── Build from source ───────────────────────────────────────────
    step "Building from source"

    # Install bun if missing
    if ! command -v bun >/dev/null 2>&1; then
      info "Installing Bun..."
      curl -fsSL https://bun.sh/install | bash || error "Failed to install Bun"
      export BUN_INSTALL="$HOME/.bun"
      export PATH="$BUN_INSTALL/bin:$PATH"
    fi

    # Install go if missing
    if ! command -v go >/dev/null 2>&1; then
      GO_VERSION="1.26.0"
      GO_ARCH="$arch"
      if [[ "$GO_ARCH" == "armv7" ]]; then GO_ARCH="armv6l"; fi
      GO_TAR="go${GO_VERSION}.${os}-${GO_ARCH}.tar.gz"

      if [[ "$(id -u)" -eq 0 ]]; then
        GO_DEST="/usr/local"
      else
        GO_DEST="$HOME/.local"
        mkdir -p "$GO_DEST"
      fi

      info "Installing Go ${GO_VERSION} to ${GO_DEST}/go..."
      curl -fsSL --progress-bar -o "$TMP_DIR/$GO_TAR" "https://go.dev/dl/$GO_TAR" \
        || error "Failed to download Go ${GO_VERSION} for ${os}-${GO_ARCH}. Check https://go.dev/dl for available builds."
      
      # Remove old Go if it exists in the destination
      if [[ -d "${GO_DEST}/go" ]]; then
        rm -rf "${GO_DEST}/go"
      fi

      tar -C "${GO_DEST}" -xzf "$TMP_DIR/$GO_TAR" || error "Failed to extract Go"
      export PATH="${GO_DEST}/go/bin:$PATH"
      info "Go installed successfully"
    fi

    info "Cloning ${REPO} (branch: ${BRANCH})..."
    git clone --branch "$BRANCH" --depth 1 "https://github.com/${REPO}.git" "$TMP_DIR/src" \
      || error "Failed to clone ${REPO} branch '${BRANCH}'"

    mkdir -p "$INSTALL_DIR"

    info "Installing frontend dependencies..."
    cd "$TMP_DIR/src/apps/web" && bun install \
      || error "Failed to install frontend dependencies"

    info "Installing Go dependencies..."
    cd "$TMP_DIR/src/server" && go mod tidy && go mod download \
      || error "Failed to install Go dependencies"

    info "Downloading LiveKit server..."
    make -C "$TMP_DIR/src" livekit-download \
      || error "Failed to download LiveKit server"
    mkdir -p "$TMP_DIR/src/server/internal/livekit/bin"
    test -f "$TMP_DIR/src/server/internal/livekit/bin/livekit-server" \
      || cp "$HOME/.local/bin/livekit-server" "$TMP_DIR/src/server/internal/livekit/bin/livekit-server"

    info "Building bedrud (this may take a few minutes)..."
    make -C "$TMP_DIR/src" build \
      || error "Build failed. Check output above for errors."

    BINARY_PATH="$TMP_DIR/src/server/dist/${BINARY_NAME}"
    if [[ ! -x "$BINARY_PATH" ]]; then
      error "Build succeeded but binary not found at ${BINARY_PATH}"
    fi

    rm -f "${INSTALL_DIR}/${BINARY_NAME}" 2>/dev/null || true
    mv "$BINARY_PATH" "${INSTALL_DIR}/${BINARY_NAME}"

    info "Installed bedrud to ${INSTALL_DIR}/${BINARY_NAME}"
  else
    # ── Download pre-built binary ───────────────────────────────────
    ARCHIVE="${TMP_DIR}/bedrud.tar.xz"

    info "Downloading bedrud..."
    curl --fail --location --progress-bar --output "$ARCHIVE" "${RELEASE_URL}/bedrud_${TARGET}.tar.xz" \
      || error "Failed to download bedrud for ${TARGET}. Check https://github.com/${REPO}/releases for available builds."

    mkdir -p "$TMP_DIR/extracted"
    tar -xf "$ARCHIVE" -C "$TMP_DIR/extracted"

    # ── Find and install binary ─────────────────────────────────────
    BINARY_PATH="$(find "$TMP_DIR/extracted" -type f -name "$BINARY_NAME" -o -name "${BINARY_NAME}.*" 2>/dev/null | head -1)"

    if [[ -z "$BINARY_PATH" ]]; then
      warn "Archive contents:"
      ls -laR "$TMP_DIR/extracted" >&2
      error "Could not find '${BINARY_NAME}' binary in archive"
    fi

    rm -f "${INSTALL_DIR}/${BINARY_NAME}" 2>/dev/null || true
    mv "$BINARY_PATH" "${INSTALL_DIR}/${BINARY_NAME}"

    info "Installed bedrud to ${INSTALL_DIR}/${BINARY_NAME}"
  fi
  chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
fi

if [[ -x "${INSTALL_DIR}/${BINARY_NAME}" ]]; then
  info "Binary ready"
else
  error "Binary not found or not executable at ${INSTALL_DIR}/${BINARY_NAME}"
fi

# ── PATH check ──────────────────────────────────────────────────
in_path() {
  [[ ":$PATH:" == *":${INSTALL_DIR}:"* ]]
}

READY=false
if in_path; then
  info "Already in PATH"
  READY=true
else
  if [[ "$SKIP_SHELL" == true ]]; then
    info "Skipping shell config (--skip-shell)"
    echo ""
    echo "  Add to PATH:"
    echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
    echo ""
  else
    configure_shell() {
      local rc_file="$1"
      local export_line="export PATH=\"${INSTALL_DIR}:\$PATH\"  # bedrud"

      if [[ -f "$rc_file" ]] && grep -q "# bedrud" "$rc_file" 2>/dev/null; then
        info "Already configured in ${rc_file}"
        return 0
      fi

      if [[ -w "$rc_file" ]] || [[ ! -f "$rc_file" && -w "$(dirname "$rc_file")" ]]; then
        {
          echo ""
          echo "# bedrud"
          echo "$export_line"
        } >> "$rc_file"
        info "Added to ${rc_file}"
      else
        warn "Cannot write to ${rc_file}"
        return 1
      fi
    }

    SHELL_NAME="$(basename "${SHELL:-}")"
    CONFIGURED=false

    case "$SHELL_NAME" in
      fish)
        fish_config="${XDG_CONFIG_HOME:-$HOME/.config}/fish/config.fish"
        export_line="set --export PATH ${INSTALL_DIR} \$PATH  # bedrud"

        if [[ -f "$fish_config" ]] && grep -q "# bedrud" "$fish_config" 2>/dev/null; then
          info "Already configured in ${fish_config}"
          CONFIGURED=true
        elif [[ -w "$fish_config" ]] || [[ ! -f "$fish_config" && -w "$(dirname "$fish_config")" ]]; then
          mkdir -p "$(dirname "$fish_config")"
          {
            echo ""
            echo "# bedrud"
            echo "$export_line"
          } >> "$fish_config"
          info "Added to ${fish_config}"
          CONFIGURED=true
        fi
        ;;

      zsh)
        zdotdir="${ZDOTDIR:-$HOME}"
        if configure_shell "${zdotdir}/.zshrc"; then
          CONFIGURED=true
        fi
        ;;

      bash)
        if [[ "$(uname -s)" == "Darwin" ]]; then
          bash_configs=("$HOME/.bash_profile" "$HOME/.bashrc")
        else
          bash_configs=("$HOME/.bashrc" "$HOME/.bash_profile")
        fi
        for rc in "${bash_configs[@]}"; do
          if configure_shell "$rc"; then
            CONFIGURED=true
            break
          fi
        done
        ;;

      *)
        warn "Unknown shell: ${SHELL_NAME}"
        ;;
    esac

    if [[ "$CONFIGURED" != true ]]; then
      echo ""
      echo "  Add to PATH manually:"
      echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
      echo ""
    fi
  fi
fi

# ════════════════════════════════════════════════════════════════
# ── Interactive Server Setup (Linux: systemd / openrc / sysvinit) ──
# ════════════════════════════════════════════════════════════════

CAN_SETUP=false
INIT_SYSTEM="none"
SKIP_REASON=""

if [[ "$os" != "linux" ]]; then
  SKIP_REASON="Interactive setup only supports Linux."
elif [[ "$NO_SETUP" == true ]]; then
  SKIP_REASON=""
elif [[ -d /run/systemd/system ]]; then
  INIT_SYSTEM="systemd"
  CAN_SETUP=true
elif [[ -x /sbin/openrc ]]; then
  INIT_SYSTEM="openrc"
  CAN_SETUP=true
elif command -v service >/dev/null 2>&1; then
  INIT_SYSTEM="sysv"
  CAN_SETUP=true
else
  SKIP_REASON="No supported init system found (need systemd, openrc, or sysvinit)."
fi

if [[ "$CAN_SETUP" == true ]]; then
  printf "\n${BOLD}${BLUE}╔══════════════════════════════════════════╗${RESET}\n"
  printf "${BOLD}${BLUE}║     Bedrud Interactive Server Setup      ║${RESET}\n"
  printf "${BOLD}${BLUE}╚══════════════════════════════════════════╝${RESET}\n\n"

  # ── Phase 2: Environment Detection ─────────────────────────────
  step "Detecting environment"

  DETECTED_DISTRO="unknown"
  if [[ -f /etc/os-release ]]; then
    DETECTED_DISTRO="$(grep -m1 '^ID=' /etc/os-release | cut -d= -f2 | tr -d '"')"
  fi
  info "Distro: ${DETECTED_DISTRO}"
  info "Init: ${INIT_SYSTEM}"

  if [[ "$(id -u)" -ne 0 ]]; then
    error "Server setup requires root. Re-run with sudo or as root."
  fi

  PUBLIC_IP=""
  info "Detecting public IP..."
  PUBLIC_IP="$(curl -s --connect-timeout 5 --max-time 10 https://ifconfig.me 2>/dev/null \
    || curl -s --connect-timeout 5 --max-time 10 https://api.ipify.org 2>/dev/null \
    || curl -s --connect-timeout 5 --max-time 10 https://icanhazip.com 2>/dev/null \
    || true)"
  if [[ -n "$PUBLIC_IP" ]]; then
    info "Public IP: ${PUBLIC_IP}"
  else
    warn "Could not detect public IP"
  fi

  LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  if [[ -n "$LOCAL_IP" ]]; then
    info "Local IP: ${LOCAL_IP}"
  fi

  HAS_DOCKER=false
  if command -v docker >/dev/null 2>&1; then
    HAS_DOCKER=true
    info "Docker: available"
  else
    info "Docker: not found"
  fi

  # ── Phase 2b: Existing install check ───────────────────────────
  FRESH_FLAG=""
  if [[ -d /etc/bedrud ]]; then
    warn "Existing installation found at /etc/bedrud"
    ask_yn "Remove existing and reinstall?" "Y" DO_REINSTALL
    if [[ "$DO_REINSTALL" == true ]]; then
      FRESH_FLAG="--fresh"
      info "Will reinstall (--fresh)"
    else
      info "Keeping existing installation"
    fi
  fi

  # ── Phase 3: Interactive Q&A ───────────────────────────────────
  step "Configuration"

  # -- Q1: Domain or IP-only --
  USE_DOMAIN=false
  DOMAIN=""
  EMAIL=""
  ask_yn "Use a domain name? (required for Let's Encrypt HTTPS)" "Y" USE_DOMAIN

  if [[ "$USE_DOMAIN" == true ]]; then
    ask "Domain name (e.g. meet.example.com)" "" SETUP_DOMAIN
    DOMAIN="$SETUP_DOMAIN"
    ask "Email for Let's Encrypt" "" SETUP_EMAIL
    EMAIL="$SETUP_EMAIL"
  fi

  # -- Q2: TLS --
  TLS_MODE="none"
  if [[ "$USE_DOMAIN" == true ]]; then
    info "Domain set — will use Let's Encrypt for HTTPS"
    TLS_MODE="acme"
  else
    ask_yn "Enable self-signed HTTPS? (recommended for security)" "Y" USE_SELFSIGNED
    if [[ "$USE_SELFSIGNED" == true ]]; then
      TLS_MODE="selfsigned"
    fi
  fi

  # -- Q3: Database --
  DB_TYPE="sqlite"
  PG_HOST="" PG_PORT="" PG_USER="" PG_PASS="" PG_DBNAME=""
  PG_DOCKER_CREATED=false

  printf "\n${BOLD}Database type:${RESET}\n"
  printf "  1) SQLite     (default, no setup)\n"
  printf "  2) Postgres   (production, scalable)\n"
  ask "Choose [1-2]" "1" DB_CHOICE

  if [[ "$DB_CHOICE" == "2" || "$DB_CHOICE" == "postgres" || "$DB_CHOICE" == "p" ]]; then
    DB_TYPE="postgres"
    if [[ "$HAS_DOCKER" == true ]]; then
      ask_yn "Run Postgres in Docker? (recommended — auto-configured, isolated)" "Y" USE_DOCKER_PG
      if [[ "$USE_DOCKER_PG" == true ]]; then
        PG_DOCKER_CREATED=true
        PG_HOST="127.0.0.1"
        PG_PORT="5432"
        PG_USER="bedrud"
        PG_DBNAME="bedrud"
        PG_PASS="$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 24)"
        info "Docker Postgres will be bound to 127.0.0.1 only (not accessible from outside)"
      else
        ask_pg_details
      fi
    else
      ask_pg_details
    fi
  fi

  # -- Q4: Behind proxy/CDN --
  BEHIND_PROXY=false
  ask_yn "Running behind a proxy/CDN? (Cloudflare, nginx, etc.)" "N" BEHIND_PROXY

  # -- Q5: Admin user --
  step "Admin user"
  ask "Admin display name" "" ADMIN_NAME
  ask "Admin email" "" ADMIN_EMAIL

  ADMIN_PASS=""
  ADMIN_PASS_CONFIRM=""
  while true; do
    ask "Admin password" "" ADMIN_PASS "true"
    ask "Confirm password" "" ADMIN_PASS_CONFIRM "true"
    if [[ "$ADMIN_PASS" == "$ADMIN_PASS_CONFIRM" ]]; then
      break
    fi
    warn "Passwords do not match. Try again."
  done
  unset ADMIN_PASS_CONFIRM

  # ── Summary ────────────────────────────────────────────────────
  step "Summary"
  echo ""
  printf "  ${BOLD}Domain:${RESET}       %s\n" "${DOMAIN:-IP-only (${PUBLIC_IP:-unknown})}"
  printf "  ${BOLD}TLS:${RESET}         %s\n" "$TLS_MODE"
  printf "  ${BOLD}Database:${RESET}    %s\n" "$DB_TYPE"
  if [[ "$DB_TYPE" == "postgres" ]]; then
    printf "  ${BOLD}PG Host:${RESET}     %s:%s\n" "$PG_HOST" "$PG_PORT"
    if [[ "$PG_DOCKER_CREATED" == true ]]; then
      printf "  ${BOLD}PG Docker:${RESET}   yes (127.0.0.1 only)\n"
    fi
  fi
  printf "  ${BOLD}Behind proxy:${RESET} %s\n" "$BEHIND_PROXY"
  printf "  ${BOLD}Init system:${RESET} %s\n" "$INIT_SYSTEM"
  printf "  ${BOLD}Admin:${RESET}       %s (%s)\n" "$ADMIN_NAME" "$ADMIN_EMAIL"
  echo ""

  ask_yn "Proceed with installation?" "Y" PROCEED
  if [[ "$PROCEED" != true ]]; then
    info "Setup cancelled. Binary installed at ${INSTALL_DIR}/${BINARY_NAME}"
    exit 0
  fi

  # ── Phase 3.5: Start Docker Postgres (if needed) ───────────────
  if [[ "$PG_DOCKER_CREATED" == true ]]; then
    step "Starting Postgres container"

    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q '^bedrud-postgres$'; then
      info "Removing existing bedrud-postgres container..."
      docker rm -f bedrud-postgres >/dev/null 2>&1 || true
    fi

    docker run -d \
      --name bedrud-postgres \
      -e POSTGRES_USER="${PG_USER}" \
      -e POSTGRES_PASSWORD="${PG_PASS}" \
      -e POSTGRES_DB="${PG_DBNAME}" \
      -v bedrud-pgdata:/var/lib/postgresql/data \
      -p 127.0.0.1:5432:5432 \
      --restart unless-stopped \
      postgres:alpine >/dev/null 2>&1 \
      || error "Failed to start Postgres container"

    info "Postgres container started (bound to 127.0.0.1 — not accessible from outside)"
    info "Waiting for Postgres to be ready..."
    for i in $(seq 1 30); do
      if docker exec bedrud-postgres pg_isready -U "${PG_USER}" -d "${PG_DBNAME}" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
    if ! docker exec bedrud-postgres pg_isready -U "${PG_USER}" -d "${PG_DBNAME}" >/dev/null 2>&1; then
      error "Postgres did not become ready in 30s"
    fi
    info "Postgres ready"
  fi

  # ── Phase 4: Run bedrud install ────────────────────────────────
  step "Running bedrud install"

  INSTALL_CMD="${INSTALL_DIR}/${BINARY_NAME} install ${FRESH_FLAG}"

  if [[ -n "$DOMAIN" ]]; then
    INSTALL_CMD+=" --domain ${DOMAIN}"
  fi
  if [[ -n "$EMAIL" ]]; then
    INSTALL_CMD+=" --email ${EMAIL}"
  fi
  if [[ -n "$PUBLIC_IP" ]]; then
    INSTALL_CMD+=" --ip ${PUBLIC_IP}"
  fi

  case "$TLS_MODE" in
    acme)       ;;
    selfsigned) INSTALL_CMD+=" --self-signed" ;;
    none)       INSTALL_CMD+=" --no-tls" ;;
  esac

  if [[ "$BEHIND_PROXY" == true ]]; then
    INSTALL_CMD+=" --behind-proxy"
  fi

  info "Running: ${INSTALL_CMD}"
  echo ""

  if ! eval "$INSTALL_CMD"; then
    echo ""
    error "bedrud install failed. Check output above for details."
  fi
  info "bedrud install completed"

  # ── Phase 5: Postgres config swap ──────────────────────────────
  if [[ "$DB_TYPE" == "postgres" && -f "$CONFIG_FILE" ]]; then
    step "Configuring Postgres"

    if command -v sed >/dev/null 2>&1; then
      sed -i -e 's|type: "sqlite"|type: "postgres"|' -e '/path: /d' "$CONFIG_FILE"

      if ! grep -q 'host:' "$CONFIG_FILE" 2>/dev/null; then
        sed -i "/type: \"postgres\"/a \\  host: \"${PG_HOST}\"\n  port: \"${PG_PORT}\"\n  dbname: \"${PG_DBNAME}\"\n  user: \"${PG_USER}\"\n  password: \"${PG_PASS}\"\n  sslmode: \"disable\"" "$CONFIG_FILE"
      fi

      info "Config updated for Postgres"
    else
      warn "sed not found. Edit ${CONFIG_FILE} manually for Postgres settings."
    fi

    case "$INIT_SYSTEM" in
      systemd) systemctl restart bedrud 2>/dev/null || true ;;
      openrc)  rc-service bedrud restart 2>/dev/null || true ;;
      sysv)    service bedrud restart 2>/dev/null || true ;;
    esac
  fi

  # ── Phase 5.5: Wait for service to be ready ────────────────────
  step "Waiting for bedrud service"

  WAIT_URL=""
  case "$TLS_MODE" in
    acme)       WAIT_URL="https://${DOMAIN}" ;;
    selfsigned) WAIT_URL="https://${PUBLIC_IP:-localhost}" ;;
    none)       WAIT_URL="http://${PUBLIC_IP:-localhost}:8090" ;;
  esac

  WAIT_OK=false
  for i in $(seq 1 30); do
    WAIT_CODE="$(curl -sk -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 "${WAIT_URL}" 2>/dev/null || true)"
    if [[ "$WAIT_CODE" =~ ^[23] ]]; then
      info "Service ready (HTTP ${WAIT_CODE})"
      WAIT_OK=true
      break
    fi
    sleep 1
  done
  if [[ "$WAIT_OK" != true ]]; then
    warn "Service not responding after 30s. User creation may fail."
  fi

  # ── Phase 6: Create admin user ─────────────────────────────────
  step "Creating admin user"

  USER_CREATED=false
  for i in 1 2 3; do
    if "${INSTALL_DIR}/${BINARY_NAME}" user --config "$CONFIG_FILE" create \
      --email "$ADMIN_EMAIL" \
      --password "$ADMIN_PASS" \
      --name "$ADMIN_NAME"; then
      USER_CREATED=true
      break
    fi
    if [[ $i -lt 3 ]]; then
      warn "User creation failed (attempt $i/3). Retrying in 5s..."
      sleep 5
    fi
  done
  if [[ "$USER_CREATED" != true ]]; then
    error "Failed to create admin user after 3 attempts"
  fi
  info "Admin user created"

  USER_PROMOTED=false
  for i in 1 2 3; do
    if "${INSTALL_DIR}/${BINARY_NAME}" user --config "$CONFIG_FILE" promote \
      --email "$ADMIN_EMAIL"; then
      USER_PROMOTED=true
      break
    fi
    if [[ $i -lt 3 ]]; then
      warn "User promote failed (attempt $i/3). Retrying in 5s..."
      sleep 5
    fi
  done
  if [[ "$USER_PROMOTED" != true ]]; then
    error "Failed to promote admin user after 3 attempts"
  fi
  info "Admin promoted to superadmin"
  unset ADMIN_PASS

  # ── Phase 7: Verify ────────────────────────────────────────────
  step "Verifying installation"

  VERIFY_OK=true

  case "$INIT_SYSTEM" in
    systemd)
      if systemctl is-active --quiet bedrud 2>/dev/null; then
        info "bedrud service: active"
      else
        warn "bedrud service: NOT active"
        VERIFY_OK=false
      fi

      if systemctl is-active --quiet livekit 2>/dev/null; then
        info "livekit service: active"
      else
        if systemctl list-unit-files livekit.service 2>/dev/null | grep -q livekit; then
          warn "livekit service: NOT active"
          VERIFY_OK=false
        fi
      fi
      ;;
    openrc)
      if rc-service bedrud status >/dev/null 2>&1; then
        info "bedrud service: active"
      else
        warn "bedrud service: NOT active"
        VERIFY_OK=false
      fi
      ;;
    sysv)
      if service bedrud status >/dev/null 2>&1; then
        info "bedrud service: active"
      else
        warn "bedrud service: NOT active (or not yet registered)"
        VERIFY_OK=false
      fi
      ;;
  esac

  VERIFY_URL=""
  case "$TLS_MODE" in
    acme)       VERIFY_URL="https://${DOMAIN}" ;;
    selfsigned) VERIFY_URL="https://${PUBLIC_IP:-localhost}" ;;
    none)       VERIFY_URL="http://${PUBLIC_IP:-localhost}:8090" ;;
  esac

  HEALTH_CODE=""
  HEALTH_CODE="$(curl -sk -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 "${VERIFY_URL}" 2>/dev/null || true)"
  if [[ "$HEALTH_CODE" =~ ^[23] ]]; then
    info "Health check: OK (HTTP ${HEALTH_CODE})"
  else
    warn "Health check: no response (HTTP ${HEALTH_CODE:-none})"
    warn "Service may still be starting. Check: systemctl status bedrud"
  fi

  # ── Final output ───────────────────────────────────────────────
  printf "\n"
  printf "${GREEN}${BOLD}╔══════════════════════════════════════════╗${RESET}\n"
  printf "${GREEN}${BOLD}║       Bedrud installed successfully!     ║${RESET}\n"
  printf "${GREEN}${BOLD}╚══════════════════════════════════════════╝${RESET}\n"
  printf "\n"
  printf "  ${BOLD}Access URL:${RESET}   %s\n" "$VERIFY_URL"
  printf "  ${BOLD}Admin:${RESET}        %s (%s)\n" "$ADMIN_NAME" "$ADMIN_EMAIL"
  if [[ "$PG_DOCKER_CREATED" == true ]]; then
    printf "  ${BOLD}Postgres:${RESET}     Docker (bedrud-postgres, 127.0.0.1:5432)\n"
  fi
  printf "  ${BOLD}Config:${RESET}       %s\n" "$CONFIG_FILE"
  case "$INIT_SYSTEM" in
    systemd)
      printf "  ${BOLD}Logs:${RESET}         journalctl -u bedrud -f\n"
      ;;
    openrc)
      printf "  ${BOLD}Logs:${RESET}         tail -f /var/log/bedrud/bedrud.log\n"
      printf "  ${BOLD}Status:${RESET}       rc-service bedrud status\n"
      ;;
    sysv)
      printf "  ${BOLD}Logs:${RESET}         tail -f /var/log/bedrud/bedrud.log\n"
      printf "  ${BOLD}Status:${RESET}       service bedrud status\n"
      ;;
  esac
  printf "\n"
  if [[ "$VERIFY_OK" != true ]]; then
    case "$INIT_SYSTEM" in
      systemd)
        printf "  ${YELLOW}${BOLD}Some services not yet active.${RESET} Check:\n"
        printf "    systemctl status bedrud\n"
        printf "    systemctl status livekit\n"
        printf "    journalctl -u bedrud --no-pager -n 50\n"
        ;;
      openrc)
        printf "  ${YELLOW}${BOLD}Some services not yet active.${RESET} Check:\n"
        printf "    rc-service bedrud status\n"
        printf "    tail -n 50 /var/log/bedrud/bedrud.log\n"
        ;;
      sysv)
        printf "  ${YELLOW}${BOLD}Some services not yet active.${RESET} Check:\n"
        printf "    service bedrud status\n"
        printf "    tail -n 50 /var/log/bedrud/bedrud.log\n"
        ;;
    esac
    printf "\n"
  fi

# ════════════════════════════════════════════════════════════════
# ── Non-Linux / no init: download-only output ───────────────────
# ════════════════════════════════════════════════════════════════
else
  if [[ -n "$SKIP_REASON" ]]; then
    printf "\n${YELLOW}${BOLD}Setup skipped:${RESET} %s\n" "$SKIP_REASON"
    echo ""
    echo "  To set up bedrud as a system service later:"
    echo "    bedrud install --help"
    echo ""
  fi
  printf "${GREEN}${BOLD}bedrud installed!${RESET}\n\n"
  if $READY; then
    echo "  Get started:"
    echo ""
    echo "    bedrud run"
    echo ""
  else
    case "${SHELL_NAME:-bash}" in
      fish) echo "  Restart fish or run:"; echo "    exec fish" ;;
      zsh)  echo "  Restart your shell or run:"; echo "    source ~/.zshrc" ;;
      *)    echo "  Restart your shell or run:"; echo "    source ~/.bashrc" ;;
    esac
    echo ""
    echo "  Then:"
    echo ""
    echo "    bedrud run"
    echo ""
  fi
fi
