#!/usr/bin/env bash
# bedrud installer — curl -fsSL https://get.bedrud.org | bash
set -euo pipefail

BINARY_NAME="bedrud"
REPO="${BEDRUD_REPO:-bedrud-ir/bedrud}"
INSTALL_DIR="${BEDRUD_INSTALL:-$HOME/bin}"
VERSION="latest"
SKIP_SHELL=false
DEBUG_BUILD=false

# ── Colors (tty only) ───────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BOLD='\033[1m'
  DIM='\033[2m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BOLD='' DIM='' RESET=''
fi

info()  { printf "${GREEN}info${RESET}  %s\n" "$*" ; }
warn()  { printf "${YELLOW}warn${RESET}  %s\n" "$*" ; }
error() { printf "${RED}error${RESET} %s\n" "$*" >&2; exit 1 ; }

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

HAS_UNZIP=false
HAS_TAR=false
command -v unzip >/dev/null 2>&1 && HAS_UNZIP=true
command -v tar >/dev/null 2>&1 && HAS_TAR=true

[[ "$HAS_UNZIP" == true || "$HAS_TAR" == true ]] || error "unzip or tar is required"

# ── Arg parse ───────────────────────────────────────────────────
usage() {
  cat <<EOF
${BOLD}bedrud installer${RESET}

Usage: curl -fsSL https://get.bedrud.org | bash -s -- [options]

Options:
  --install-dir <dir>   Install directory (default: ~/bin)
  --version <ver>       Install specific version (default: latest)
  --skip-shell          Skip shell RC / PATH modification
  --debug               Install debug/profile build
  -h, --help            Show this help

Environment:
  BEDRUD_INSTALL        Override install directory
  BEDRUD_REPO           Override GitHub repo (default: bedrud-ir/bedrud)

Examples:
  curl -fsSL https://get.bedrud.org | bash
  curl -fsSL https://get.bedrud.org | bash -s -- --version v1.2.0
  curl -fsSL https://get.bedrud.org | bash -s -- --install-dir /usr/local/bin
EOF
  exit 0
}

[[ $# -gt 4 ]] && error "Too many arguments. Run with --help for usage."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    --version)     VERSION="$2"; shift 2 ;;
    --skip-shell)  SKIP_SHELL=true; shift ;;
    --debug)       DEBUG_BUILD=true; shift ;;
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
  x86_64|amd64)         arch="x64" ;;
  aarch64|arm64)        arch="aarch64" ;;
  armv7l|armv7)         arch="armv7" ;;
  *) error "Unsupported architecture: $ARCH" ;;
esac

TARGET="${os}-${arch}"

# ── Edge cases ──────────────────────────────────────────────────

# Alpine → musl
if [[ "$os" == "linux" ]] && [[ -f /etc/alpine-release ]]; then
  TARGET="${TARGET}-musl"
fi

# Rosetta 2 → use native ARM
if [[ "$os" == "darwin" ]] && [[ "$arch" == "x64" ]]; then
  if sysctl -n sysctl.proc_translated 2>/dev/null | grep -q "1"; then
    TARGET="darwin-aarch64"
    info "Rosetta 2 detected — using native ARM binary"
  fi
fi

# AVX2 baseline (Linux x64 only)
if [[ "$os" == "linux" ]] && [[ "$arch" == "x64" ]]; then
  if grep -q avx2 /proc/cpuinfo 2>/dev/null; then
    : # AVX2 supported, standard build
  else
    TARGET="${TARGET}-baseline"
    info "No AVX2 — using baseline build"
  fi
fi

# AVX2 baseline (macOS x64, non-Rosetta)
if [[ "$os" == "darwin" ]] && [[ "$arch" == "x64" ]]; then
  if ! sysctl -a 2>/dev/null | grep -q "machdep.cpu.features.*AVX2"; then
    TARGET="${TARGET}-baseline"
    info "No AVX2 — using baseline build"
  fi
fi

# Debug/profile build
if [[ "$DEBUG_BUILD" == true ]]; then
  TARGET="${TARGET}-profile"
  info "Debug/profile build requested"
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

download_and_extract() {
  local url="$1"
  local ext="$2"

  local archive="${TMP_DIR}/bedrud.${ext}"

  info "Downloading bedrud (${ext})..."
  curl --fail --location --progress-bar --output "$archive" "$url" \
    || return 1

  case "$ext" in
    zip)
      if [[ "$HAS_UNZIP" != true ]]; then
        warn "unzip not available, trying tar.xz instead"
        return 1
      fi
      unzip -oq -d "$TMP_DIR/extracted" "$archive"
      ;;
    tar.xz)
      tar -xf "$archive" -C "$TMP_DIR/extracted"
      ;;
  esac

  return 0
}

mkdir -p "$TMP_DIR/extracted"

DOWNLOADED=false

# Try zip first, fallback to tar.xz
if [[ "$HAS_UNZIP" == true ]]; then
  if download_and_extract "${RELEASE_URL}/bedrud_${TARGET}.zip" "zip"; then
    DOWNLOADED=true
  fi
fi

if [[ "$DOWNLOADED" != true ]] && [[ "$HAS_TAR" == true ]]; then
  if download_and_extract "${RELEASE_URL}/bedrud_${TARGET}.tar.xz" "tar.xz"; then
    DOWNLOADED=true
  fi
fi

if [[ "$DOWNLOADED" != true ]]; then
  error "Failed to download bedrud for ${TARGET}. Check https://github.com/${REPO}/releases for available builds."
fi

# ── Find and install binary ─────────────────────────────────────
BINARY_PATH="$(find "$TMP_DIR/extracted" -type f -name "$BINARY_NAME" -o -name "${BINARY_NAME}.*" 2>/dev/null | head -1)"

if [[ -z "$BINARY_PATH" ]]; then
  # List contents for debug
  warn "Archive contents:"
  ls -laR "$TMP_DIR/extracted" >&2
  error "Could not find '${BINARY_NAME}' binary in archive"
fi

mv "$BINARY_PATH" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

info "Installed bedrud to ${INSTALL_DIR}/${BINARY_NAME}"

# ── Verify ──────────────────────────────────────────────────────
INSTALLED_VERSION="$("${INSTALL_DIR}/${BINARY_NAME}" --version 2>/dev/null || echo "unknown")"
info "Version: ${INSTALLED_VERSION}"

# ── PATH check ──────────────────────────────────────────────────
in_path() {
  echo "$PATH" | tr ':' '\n' | while read -r p; do
    [[ "$p" == "$INSTALL_DIR" ]] && return 0
  done
  return 1
}

if in_path; then
  info "Already in PATH"
else
  if [[ "$SKIP_SHELL" == true ]]; then
    info "Skipping shell config (--skip-shell)"
    echo ""
    echo "  Add to PATH:"
    echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
    echo ""
  else
    # ── Shell config ────────────────────────────────────────────
    configure_shell() {
      local rc_file="$1"
      local export_line="export PATH=\"${INSTALL_DIR}:\$PATH\"  # bedrud"

      # Idempotent: skip if already configured
      if [[ -f "$rc_file" ]] && grep -q "# bedrud" "$rc_file" 2>/dev/null; then
        info "Already configured in ${rc_file}"
        return 0
      fi

      # Writable or can create
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
        # macOS: .bash_profile (login shells), Linux: .bashrc
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

# ── Completions ─────────────────────────────────────────────────
"${INSTALL_DIR}/${BINARY_NAME}" completions 2>/dev/null || true

# ── Done ────────────────────────────────────────────────────────
printf "\n${GREEN}${BOLD}bedrud installed!${RESET}\n\n"
echo "  Restart your shell or run:"
echo ""
echo "    source ~/.${SHELL_NAME}rc"
echo ""
echo "  Then:"
echo ""
echo "    bedrud run"
echo ""
