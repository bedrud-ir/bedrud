# Package Installation

This guide covers all available package manager and binary installation methods for Bedrud — both the **server** and the **desktop client**.

---

## Server Installation

### apt Repository (Ubuntu / Debian)

The easiest way to install the Bedrud server on Debian-based systems is via the self-hosted apt repository hosted on GitHub Pages.

**1. Add the repository and GPG key:**

```bash
curl -fsSL https://bedrud-ir.github.io/bedrud/bedrud.gpg.key \
  | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/bedrud.gpg

echo "deb https://bedrud-ir.github.io/bedrud stable main" \
  | sudo tee /etc/apt/sources.list.d/bedrud.list
```

**2. Install:**

```bash
sudo apt update && sudo apt install bedrud
```

The package installs the binary to `/usr/local/bin/bedrud` and registers a systemd service. After installing, run the interactive installer:

```bash
sudo bedrud install
```

See the [Installation Guide](../getting-started/installation.md) for all configuration options.

---

### AUR (Arch Linux)

```bash
yay -S bedrud-bin
```

After installing, run:

```bash
sudo bedrud install
```

---

### Direct .deb Download

Download the `.deb` package directly from the [latest GitHub release](https://github.com/bedrud-ir/bedrud/releases/latest):

=== "x86_64 (amd64)"

    ```bash
    wget https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud_amd64.deb
    sudo dpkg -i bedrud_amd64.deb
    sudo apt-get install -f   # resolve any missing dependencies
    ```

=== "ARM64"

    ```bash
    wget https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud_arm64.deb
    sudo dpkg -i bedrud_arm64.deb
    sudo apt-get install -f
    ```

---

### Manual Binary Download

Download the compressed tarball and extract it anywhere on your `$PATH`:

=== "Linux x86_64"

    ```bash
    curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud_linux_amd64.tar.xz \
      | tar xJ
    sudo mv bedrud /usr/local/bin/
    ```

=== "Linux ARM64"

    ```bash
    curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud_linux_arm64.tar.xz \
      | tar xJ
    sudo mv bedrud /usr/local/bin/
    ```

---

### Docker

Pull the pre-built image from GitHub Container Registry:

```bash
docker pull ghcr.io/bedrud-ir/bedrud:latest
docker run -d \
  --name bedrud \
  -p 8090:8090 \
  -p 7880:7880 \
  -v bedrud-data:/var/lib/bedrud \
  ghcr.io/bedrud-ir/bedrud:latest
```

See the [Docker Guide](docker.md) for full details including volume mounts and reverse proxy setup.

---

## Desktop Client Installation

### Linux

=== "Ubuntu/Debian (apt)"

    Add the apt repository first (see [Server — apt Repository](#apt-repository-ubuntu-debian) above), then:

    ```bash
    sudo apt install bedrud-desktop
    ```

    The package installs a `.desktop` launcher and registers the app in your application menu.

=== "Arch Linux (AUR)"

    ```bash
    yay -S bedrud-desktop-bin
    ```

=== "AppImage (any distro)"

    The AppImage is self-contained and works on any Linux distribution without installation.

    ```bash
    wget https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-linux-x86_64.AppImage
    chmod +x bedrud-desktop-linux-x86_64.AppImage
    ./bedrud-desktop-linux-x86_64.AppImage
    ```

    !!! tip
        To integrate AppImage into your application launcher, use a tool like [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher).

=== "Portable tar.xz"

    Extract and run from any directory:

    ```bash
    tar xf bedrud-desktop-linux-x86_64.tar.xz
    ./bedrud-desktop
    ```

---

### macOS

Pre-built portable tarballs are available for both Intel and Apple Silicon. The app is **unsigned** — after extracting you may need to allow it in **System Settings → Privacy & Security**.

=== "Apple Silicon (arm64)"

    ```bash
    curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-macos-arm64.tar.gz \
      | tar xz
    # Allow the binary if macOS blocks it:
    xattr -d com.apple.quarantine bedrud-desktop
    ./bedrud-desktop
    ```

=== "Intel (x86_64)"

    ```bash
    curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-macos-x86_64.tar.gz \
      | tar xz
    xattr -d com.apple.quarantine bedrud-desktop
    ./bedrud-desktop
    ```

!!! warning
    macOS Gatekeeper will block unsigned binaries by default. Either run the `xattr` command above, or open **System Settings → Privacy & Security** and click **Open Anyway** after the first blocked launch attempt.

---

### Windows

=== "NSIS Installer (recommended)"

    Download and run the installer from the [latest release](https://github.com/bedrud-ir/bedrud/releases/latest):

    | Architecture | File |
    |---|---|
    | x86_64 | `bedrud-desktop-windows-x86_64-setup.exe` |
    | ARM64 | `bedrud-desktop-windows-arm64-setup.exe` |

    The installer registers the app in the Start Menu and Add/Remove Programs.

=== "Portable .zip"

    No installation required — extract and run:

    | Architecture | File |
    |---|---|
    | x86_64 | `bedrud-desktop-windows-x86_64.zip` |
    | ARM64 | `bedrud-desktop-windows-arm64.zip` |

---

## Summary Table

| Platform | Server | Desktop Client |
|---|---|---|
| Ubuntu / Debian (apt) | `apt install bedrud` | `apt install bedrud-desktop` |
| Arch Linux (AUR) | `yay -S bedrud-bin` | `yay -S bedrud-desktop-bin` |
| Any Linux | `tar.xz` binary | AppImage / `tar.xz` |
| macOS | `tar.xz` binary | Portable `tar.gz` (unsigned) |
| Windows | — | NSIS installer or portable `.zip` |
| Docker | `ghcr.io/bedrud-ir/bedrud` | — |
