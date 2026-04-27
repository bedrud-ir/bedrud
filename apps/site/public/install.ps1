# bedrud Windows installer
# Run: irm https://bedrud.org/install.ps1 | iex
# Or: ./install.ps1 -InstallDir C:\bedrud -Version latest

# ══════════════════════════════════════════════════════════════════════════════
# 1. Params + Globals
# ══════════════════════════════════════════════════════════════════════════════
param(
    [string]$InstallDir = "$env:USERPROFILE\bin",
    [string]$Version = "latest",
    [switch]$SkipPath = $false,
    [switch]$Build = $false,
    [string]$Branch = "main",
    [switch]$NoSetup = $false,
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"
$BinaryName = "bedrud.exe"
$Repo = if ($env:BEDRUD_REPO) { $env:BEDRUD_REPO } else { "bedrud-ir/bedrud" }
$ConfigDir = Join-Path $env:APPDATA "bedrud"
$ConfigFile = Join-Path $ConfigDir "config.yaml"

# ══════════════════════════════════════════════════════════════════════════════
# 2. WSL Detection
# ══════════════════════════════════════════════════════════════════════════════
if ($env:WSL_DISTRO_NAME -or (Test-Path "/proc/version" -ErrorAction SilentlyContinue)) {
    Write-Host "WSL detected. You should run the bash installer instead:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  curl -fsSL https://bedrud.org/install.sh | bash" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# ══════════════════════════════════════════════════════════════════════════════
# 3. Helpers (Logging & Prompts)
# ══════════════════════════════════════════════════════════════════════════════
function Info([string]$msg) { Write-Host "info  $msg" -ForegroundColor Green }
function Warn([string]$msg) { Write-Host "warn  $msg" -ForegroundColor Yellow }
function ErrorMsg([string]$msg) { Write-Host "error $msg" -ForegroundColor Red; exit 1 }
function Step([string]$msg) { 
    Write-Host ""
    Write-Host "── $msg ──" -ForegroundColor Blue -Style Bold 
}

function Ask([string]$prompt, [string]$default, [switch]$Secret) {
    $p = if ($default) { "$prompt [$default]: " } else { "$prompt: " }
    if ($Secret) {
        $val = Read-Host -Prompt $p -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($val)
        try {
            $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
            return if ([string]::IsNullOrWhiteSpace($plain)) { $default } else { $plain }
        } finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }
    } else {
        $val = Read-Host -Prompt $p
        return if ([string]::IsNullOrWhiteSpace($val)) { $default } else { $val }
    }
}

function AskYesNo([string]$prompt, [string]$default = "Y") {
    $p = if ($default -eq "Y") { "$prompt [Y/n]: " } else { "$prompt [y/N]: " }
    $val = Read-Host -Prompt $p
    if ([string]::IsNullOrWhiteSpace($val)) { $val = $default }
    return $val -match "^[yY](es)?$"
}

function AskPgDetails() {
    Warn "Ensure Postgres is not publicly accessible (bind to 127.0.0.1 or private network)."
    Write-Host ""
    $script:PG_HOST = Ask "Postgres host" "127.0.0.1"
    $script:PG_PORT = Ask "Postgres port" "5432"
    $script:PG_USER = Ask "Postgres user" "bedrud"
    $script:PG_DBNAME = Ask "Postgres database" "bedrud"
    $script:PG_PASS = Ask "Postgres password" "" -Secret
}

# ══════════════════════════════════════════════════════════════════════════════
# 4. Help & Arg Validation
# ══════════════════════════════════════════════════════════════════════════════
if ($Help) {
    @"

bedrud installer for Windows

Usage:
  irm https://bedrud.org/install.ps1 | iex
  ./install.ps1 -InstallDir C:\Tools -Version v1.2.0

Parameters:
  -InstallDir <path>   Install directory (default: ~\bin)
  -Version <ver>       Install specific version (default: latest)
  -SkipPath            Skip adding to PATH
  -Build               Build from source (requires Go, Bun, Git, Make)
  -Branch <name>       Git branch for -Build (default: main)
  -NoSetup             Download only, skip interactive setup
  -Help                Show this help

Environment:
  BEDRUD_REPO          Override GitHub repo (default: bedrud-ir/bedrud)

"@
    exit 0
}

if ($Build) {
    $missing = @()
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) { $missing += "Go (https://go.dev)" }
    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) { $missing += "Bun (https://bun.sh)" }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { $missing += "Git (https://git-scm.com)" }
    if (-not (Get-Command make -ErrorAction SilentlyContinue)) { $missing += "Make (via Chocolatey, Scoop, or WSL)" }

    if ($missing.Count -gt 0) {
        Write-Host "Missing dependencies for -Build mode:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  - $_" }
        exit 1
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# 5. Platform Detection
# ══════════════════════════════════════════════════════════════════════════════
$Os = "windows"
$Arch = "amd64"
$ProcArch = [System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture

if ($ProcArch -eq [System.Runtime.InteropServices.Architecture]::Arm64) {
    $Arch = "arm64"
} elseif ($ProcArch -eq [System.Runtime.InteropServices.Architecture]::X64) {
    $Arch = "amd64"
} elseif ($ProcArch -eq [System.Runtime.InteropServices.Architecture]::X86) {
    $Arch = "x86"
} else {
    ErrorMsg "Unsupported architecture: $ProcArch"
}

$Target = "${Os}_${Arch}"
Info "Target: $Target"

# ══════════════════════════════════════════════════════════════════════════════
# 6. Download / Build Phase
# ══════════════════════════════════════════════════════════════════════════════
$InstallDirFull = [System.IO.Path]::GetFullPath($InstallDir)
New-Item -ItemType Directory -Force -Path $InstallDirFull | Out-Null

$ExistingBin = Get-Command bedrud -ErrorAction SilentlyContinue
if ($ExistingBin) {
    Warn "bedrud already installed at $($ExistingBin.Source)"
    if (-not (AskYesNo "Reinstall / overwrite?")) {
        Info "Keeping existing binary. Skipping download/build."
        $SkipInstall = $true
    }
} elseif (Test-Path (Join-Path $InstallDirFull $BinaryName)) {
    Warn "bedrud binary found at $(Join-Path $InstallDirFull $BinaryName) (not in PATH)"
    if (-not (AskYesNo "Overwrite existing binary?")) {
        Info "Keeping existing binary. Skipping download/build."
        $SkipInstall = $true
    }
}

if (-not $SkipInstall) {
    $TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("bedrud-install-" + [System.Guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

    try {
        if ($Build) {
            Step "Building from source"
            $SrcDir = Join-Path $TempDir "src"
            Info "Cloning $Repo (branch: $Branch)..."
            git clone --branch $Branch --depth 1 "https://github.com/${Repo}.git" $SrcDir

            Info "Installing frontend dependencies..."
            Set-Location (Join-Path $SrcDir "apps/web")
            bun install

            Info "Installing Go dependencies..."
            Set-Location (Join-Path $SrcDir "server")
            go mod tidy
            go mod download

            Info "Downloading LiveKit server..."
            make -C $SrcDir livekit-download
            # On Windows, we might need to manually ensure the binary is in the right place
            $LkBinDir = Join-Path $SrcDir "server\internal\livekit\bin"
            New-Item -ItemType Directory -Force -Path $LkBinDir | Out-Null
            # Check for livekit-server.exe in common locations (InstallDir, PATH)
            $LkSource = Get-Command livekit-server -ErrorAction SilentlyContinue
            if ($LkSource) {
                Copy-Item $LkSource.Source (Join-Path $LkBinDir "livekit-server.exe") -Force
            }

            Info "Building bedrud (this may take a few minutes)..."
            make -C $SrcDir build

            $BuiltBin = Join-Path $SrcDir "server\dist\bedrud.exe"
            if (-not (Test-Path $BuiltBin)) { ErrorMsg "Build failed: binary not found at $BuiltBin" }

            Copy-Item $BuiltBin (Join-Path $InstallDirFull $BinaryName) -Force
            Info "Installed bedrud to $InstallDirFull\$BinaryName"
        } else {
            # Download mode
            $Github = "https://github.com"
            $ReleaseUrl = if ($Version -eq "latest") { "${Github}/${Repo}/releases/latest/download" } else { "${Github}/${Repo}/releases/download/${Version}" }
            $ZipUrl = "${ReleaseUrl}/bedrud_${Target}.zip"
            $ZipPath = Join-Path $TempDir "bedrud.zip"

            Info "Downloading bedrud..."
            Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing

            Expand-Archive -Path $ZipPath -DestinationPath "$TempDir\extracted" -Force

            $Found = Get-ChildItem -Path "$TempDir\extracted" -Recurse -Filter "*.exe" |
                Where-Object { $_.Name -like "bedrud*" } |
                Select-Object -First 1

            if (-not $Found) { ErrorMsg "Could not find bedrud binary in archive" }

            Copy-Item $Found.FullName (Join-Path $InstallDirFull $BinaryName) -Force
            Info "Installed bedrud to $InstallDirFull\$BinaryName"
        }
    } finally {
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        Set-Location $env:USERPROFILE
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# 7. PATH Configuration
# ══════════════════════════════════════════════════════════════════════════════
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -like "*$InstallDirFull*") {
    Info "Already in PATH"
} elseif (-not $SkipPath) {
    $NewPath = "${InstallDirFull};${CurrentPath}"
    [Environment]::SetEnvironmentVariable("PATH", $NewPath, "User")
    $env:PATH = "${InstallDirFull};${env:PATH}"
    Info "Added $InstallDirFull to PATH"
}

# ══════════════════════════════════════════════════════════════════════════════
# 8. Interactive Server Setup
# ══════════════════════════════════════════════════════════════════════════════
if ($NoSetup) {
    Write-Host ""
    Write-Host "bedrud installed!" -ForegroundColor Green
    Write-Host "Run 'bedrud run' to start."
    exit 0
}

Step "Bedrud Interactive Server Setup"

# Admin check
$isAdmin = ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Warn "Not running as Administrator. Some features (firewall, services) may fail."
}

# Environment detection
Info "Detecting environment..."
$PublicIp = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
$LocalIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress
$BedrudIp = Ask "Bedrud server IP (for TLS, access URLs, LiveKit)" (if ($PublicIp) { $PublicIp } else { $LocalIp })

# Existing install check
$FreshFlag = ""
if (Test-Path $ConfigDir) {
    Warn "Existing installation found at $ConfigDir"
    if (AskYesNo "Remove existing and reinstall?") {
        $FreshFlag = "--fresh"
        Info "Will reinstall (--fresh)"
    }
}

# Q&A
Step "Configuration"
$UseDomain = AskYesNo "Use a domain name? (required for Let's Encrypt HTTPS)" "Y"
$Domain = ""
$Email = ""
if ($UseDomain) {
    $Domain = Ask "Domain name (e.g. meet.example.com)" ""
    $Email = Ask "Email for Let's Encrypt" ""
}

$TlsMode = "none"
if ($UseDomain) {
    Info "Domain set — will use Let's Encrypt for HTTPS"
    $TlsMode = "acme"
} else {
    if (AskYesNo "Enable self-signed HTTPS? (recommended for security)") {
        $TlsMode = "selfsigned"
    }
}

# Database
$DbChoice = Ask "Database type:`n  1) SQLite     (default, no setup)`n  2) Postgres   (production, scalable)`nChoose [1-2]" "1"
$DbType = "sqlite"
$PgDockerCreated = $false

if ($DbChoice -eq "2") {
    $DbType = "postgres"
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        if (AskYesNo "Run Postgres in Docker? (recommended — auto-configured, isolated)") {
            $PgDockerCreated = $true
            $script:PG_HOST = Ask "Postgres Docker bind address" "127.0.0.1"
            $script:PG_PORT = "5432"
            $script:PG_USER = "bedrud"
            $script:PG_DBNAME = "bedrud"
            $script:PG_PASS = [Guid]::NewGuid().ToString("N").Substring(0, 24)
            Info "Postgres Docker will be bound to $PG_HOST only"
        } else {
            AskPgDetails
        }
    } else {
        AskPgDetails
    }
}

# Proxy
$BehindProxy = AskYesNo "Running behind a proxy/CDN? (Cloudflare, nginx, etc.)" "N"
$CdnType = "none"
if ($BehindProxy) {
    $CdnType = Ask "What type of proxy/CDN? (cloudflare/nginx/other)" "cloudflare"
}

# LiveKit
Step "LiveKit configuration"
$UseExternalLk = AskYesNo "Use an external LiveKit server (separate machine)?" "N"
$ExternalLkUrl = ""
$UseLkDomain = $false
$LkDomain = ""
$LkIp = $BedrudIp

if ($UseExternalLk) {
    $ExternalLkUrl = Ask "External LiveKit URL (e.g., https://lk.example.com)" ""
} else {
    if ($BehindProxy) {
        $UseLkDomain = AskYesNo "Use a separate subdomain for LiveKit? (bypasses CDN, recommended)" "Y"
        if ($UseLkDomain) {
            $LkDomain = Ask "LiveKit subdomain (e.g., lk.meet.example.com)" ""
        }
    }
    $LkIp = Ask "LiveKit server IP (real public IP, for WebRTC)" $BedrudIp
}

# Admin User
Step "Admin user"
$AdminName = Ask "Admin display name" ""
$AdminEmail = Ask "Admin email" ""
while ($true) {
    $AdminPass = Ask "Admin password" "" -Secret
    $AdminPassConfirm = Ask "Confirm password" "" -Secret
    if ($AdminPass -eq $AdminPassConfirm) { break }
    Warn "Passwords do not match. Try again."
}

# Summary
Step "Summary"
Write-Host ""
Write-Host "  Server:"
if ($Domain) { Write-Host "    Domain:       $Domain" }
Write-Host "    IP:           $BedrudIp"
Write-Host "    TLS:          $TlsMode"
Write-Host ""
Write-Host "  Database:     $DbType"
if ($DbType -eq "postgres") { Write-Host "    PG Host:      $PG_HOST`:$PG_PORT" }
Write-Host "  Admin:        $AdminName ($AdminEmail)"
Write-Host ""

if (-not (AskYesNo "Proceed with installation?")) {
    Info "Setup cancelled. Binary installed at $InstallDirFull\$BinaryName"
    exit 0
}

# Phase 3.5: Docker Postgres
if ($PgDockerCreated) {
    Step "Starting Postgres container"
    if (docker ps -a --format '{{.Names}}' | Select-String "^bedrud-postgres$") {
        Info "Removing existing bedrud-postgres container..."
        docker rm -f bedrud-postgres | Out-Null
    }
    docker run -d `
      --name bedrud-postgres `
      -e POSTGRES_USER="$PG_USER" `
      -e POSTGRES_PASSWORD="$PG_PASS" `
      -e POSTGRES_DB="$PG_DBNAME" `
      -v bedrud-pgdata:/var/lib/postgresql/data `
      -p "$($PG_HOST):5432:5432" `
      --restart unless-stopped `
      postgres:alpine | Out-Null
    
    Info "Postgres container started. Waiting for ready..."
    Start-Sleep -Seconds 5
}

# Phase 4: Run bedrud install
Step "Running bedrud install"
$BedrudExe = Join-Path $InstallDirFull $BinaryName
$Args = @("install")
if ($FreshFlag) { $Args += $FreshFlag }
if ($Domain) { $Args += "--domain", $Domain }
if ($Email) { $Args += "--email", $Email }
$Args += "--ip", $BedrudIp
if ($TlsMode -eq "selfsigned") { $Args += "--self-signed" }
if ($TlsMode -eq "none") { $Args += "--no-tls" }
if ($BehindProxy) { $Args += "--behind-proxy" }
if ($UseExternalLk) { $Args += "--external-livekit", $ExternalLkUrl }
if ($LkDomain) { $Args += "--livekit-domain", $LkDomain }
if ($LkIp -and $LkIp -ne $BedrudIp) { $Args += "--lk-ip", $LkIp }

& $BedrudExe $Args

# Phase 5: Postgres config swap
if ($DbType -eq "postgres" -and (Test-Path $ConfigFile)) {
    $content = Get-Content $ConfigFile -Raw
    $content = $content -replace 'type: "sqlite"', 'type: "postgres"'
    $content = $content -replace 'path: .*\.db', "host: `"$PG_HOST`"`r`n  port: `"$PG_PORT`"`r`n  dbname: `"$PG_DBNAME`"`r`n  user: `"$PG_USER`"`r`n  password: `"$PG_PASS`"`r`n  sslmode: `"disable`""
    Set-Content $ConfigFile $content
    Info "Config updated for Postgres"
}

# Phase 6: Admin user
Step "Creating admin user"
& $BedrudExe user --config $ConfigFile create --email $AdminEmail --password $AdminPass --name $AdminName
& $BedrudExe user --config $ConfigFile promote --email $AdminEmail

# Final Output
Step "Done"
$VerifyUrl = if ($Domain) { "https://$Domain" } elseif ($TlsMode -eq "selfsigned") { "https://$BedrudIp" } else { "http://$BedrudIp`:8090" }

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       Bedrud installed successfully!     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Access URL:   $VerifyUrl"
Write-Host "  Admin:        $AdminName ($AdminEmail)"
Write-Host "  Config:       $ConfigFile"
Write-Host ""
Write-Host "  To run as a service, consider using NSSM (https://nssm.cc) or:"
Write-Host "    sc.exe create bedrud binPath= `"$BedrudExe run --config $ConfigFile`" start= auto"
Write-Host ""
Write-Host "  Firewall: Ensure ports 80, 443, and 7880-7881 (TCP) + 50000-60000 (UDP) are open."
Write-Host ""
