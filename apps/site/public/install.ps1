# bedrud Windows installer
# Run: irm https://get.bedrud.org/install.ps1 | iex
# Or: ./install.ps1 -InstallDir C:\bedrud -Version latest

param(
    [string]$InstallDir = "$env:USERPROFILE\bin",
    [string]$Version = "latest",
    [switch]$SkipPath = $false,
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"
$BinaryName = "bedrud.exe"
$Repo = if ($env:BEDRUD_REPO) { $env:BEDRUD_REPO } else { "bedrud-ir/bedrud" }

if ($Help) {
    @"

bedrud installer for Windows

Usage:
  irm https://get.bedrud.org/install.ps1 | iex
  ./install.ps1 -InstallDir C:\Tools -Version v1.2.0

Parameters:
  -InstallDir <path>   Install directory (default: ~\bin)
  -Version <ver>       Install specific version (default: latest)
  -SkipPath            Skip adding to PATH
  -Help                Show this help

Environment:
  BEDRUD_REPO          Override GitHub repo (default: bedrud-ir/bedrud)

"@
    exit 0
}

# ── Platform detection ──────────────────────────────────────────
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
    Write-Host "Unsupported architecture: $ProcArch" -ForegroundColor Red
    exit 1
}

$Target = "${Os}_${Arch}"

Write-Host "Target: $Target" -ForegroundColor Green

# ── Construct download URL ──────────────────────────────────────
$Github = "https://github.com"
if ($Version -eq "latest") {
    $ReleaseUrl = "${Github}/${Repo}/releases/latest/download"
} else {
    $ReleaseUrl = "${Github}/${Repo}/releases/download/${Version}"
}

# ── Download ────────────────────────────────────────────────────
$InstallDirFull = [System.IO.Path]::GetFullPath($InstallDir)
New-Item -ItemType Directory -Force -Path $InstallDirFull | Out-Null

$TempDir = [System.IO.Path]::GetTempPath() + "bedrud-install-" + [System.Guid]::NewGuid().ToString("N").Substring(0, 8)
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

try {
    $ZipUrl = "${ReleaseUrl}/bedrud_${Target}.zip"
    $ZipPath = Join-Path $TempDir "bedrud.zip"

    Write-Host "Downloading bedrud..." -ForegroundColor Green

    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing

    Expand-Archive -Path $ZipPath -DestinationPath "$TempDir\extracted" -Force

    $Found = Get-ChildItem -Path "$TempDir\extracted" -Recurse -Filter "*.exe" |
        Where-Object { $_.Name -like "bedrud*" } |
        Select-Object -First 1

    if (-not $Found) {
        Write-Host "Could not find bedrud binary in archive" -ForegroundColor Red
        exit 1
    }

    Copy-Item -Path $Found.FullName -Destination (Join-Path $InstallDirFull $BinaryName) -Force
    Write-Host "Installed bedrud to $InstallDirFull\$BinaryName" -ForegroundColor Green

    # ── Verify ──────────────────────────────────────────────────
    $BedrudExe = Join-Path $InstallDirFull $BinaryName
    if (Test-Path $BedrudExe) {
        $InstalledVersion = & $BedrudExe --version 2>$null
        if ($LASTEXITCODE -eq 0 -and $InstalledVersion) {
            Write-Host "Version: $InstalledVersion" -ForegroundColor Green
        }
    }

    # ── PATH ─────────────────────────────────────────────────────
    $CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($CurrentPath -like "*$InstallDirFull*") {
        Write-Host "Already in PATH" -ForegroundColor Green
    } elseif (-not $SkipPath) {
        $NewPath = "${InstallDirFull};${CurrentPath}"
        [Environment]::SetEnvironmentVariable("PATH", $NewPath, "User")
        $env:PATH = "${InstallDirFull};${env:PATH}"
        Write-Host "Added $InstallDirFull to PATH" -ForegroundColor Green
    } else {
        Write-Host "Skipping PATH config (-SkipPath)" -ForegroundColor Yellow
    }

    # ── Done ─────────────────────────────────────────────────────
    Write-Host ""
    Write-Host "bedrud installed!" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "  Open a new terminal, then:"
    Write-Host ""
    Write-Host "    bedrud run"
    Write-Host ""

} finally {
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}
