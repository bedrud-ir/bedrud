# Client Installation

Open the meeting link in a browser to join — no installation required. For a native app experience, install the client for your platform below.

---

## Browser (Zero Install)

Open the meeting URL in **Chrome**, **Firefox**, **Edge**, or **Safari**. Camera and microphone access requires HTTPS (your server admin handles this).

No downloads, no extensions, no account required if guest access is enabled.

---

## Android

=== "Google Play"

    Search for **Bedrud** on Google Play, or follow the direct link from your server admin.

=== "APK (sideload)"

    Download the latest APK from [GitHub Releases](https://github.com/bedrud-ir/bedrud/releases/latest):

    ```bash
    # Transfer to your phone, then open to install
    ```

    You may need to enable **Install from unknown sources** in your device settings.

---

## iOS

=== "App Store"

    Search for **Bedrud** on the App Store, or follow the direct link from your server admin.

=== "IPA (sideload)"

    Download the latest IPA from [GitHub Releases](https://github.com/bedrud-ir/bedrud/releases/latest). Sideload using AltStore or a similar tool.

---

## Linux Desktop

=== "AppImage (recommended)"

    No installation required. Download, make executable, run:

    ```bash
    wget https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-linux-x86_64.AppImage
    chmod +x bedrud-desktop-linux-x86_64.AppImage
    ./bedrud-desktop-linux-x86_64.AppImage
    ```

    !!! tip
        To integrate AppImage into your application launcher, use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher).

=== "Flatpak"

    ```bash
    flatpak install https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-linux-x86_64.flatpak
    flatpak run ir.bedrud.Desktop
    ```

=== "Snap"

    ```bash
    sudo snap install bedrud-desktop
    ```

=== "Ubuntu / Debian (apt)"

    If the Bedrud apt repository is already configured on your system:

    ```bash
    sudo apt install bedrud-desktop
    ```

    See the [Package Installation guide](../guides/packages.md) for repository setup.

=== "Arch Linux (AUR)"

    ```bash
    yay -S bedrud-desktop-bin
    ```

=== "Fedora / RHEL (DNF)"

    If the Bedrud DNF repository is already configured:

    ```bash
    sudo dnf install bedrud-desktop
    ```

    See the [Package Installation guide](../guides/packages.md) for repository setup.

=== "Portable tar.xz"

    ```bash
    wget https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-linux-x86_64.tar.xz
    tar xf bedrud-desktop-linux-x86_64.tar.xz
    ./bedrud-desktop
    ```

---

## macOS

=== "Homebrew (recommended)"

    ```bash
    brew tap bedrud-ir/bedrud
    brew install bedrud-desktop
    ```

=== "Apple Silicon (arm64)"

    ```bash
    curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-macos-arm64.tar.gz | tar xz
    xattr -d com.apple.quarantine bedrud-desktop
    ./bedrud-desktop
    ```

=== "Intel (x86_64)"

    ```bash
    curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-macos-x86_64.tar.gz | tar xz
    xattr -d com.apple.quarantine bedrud-desktop
    ./bedrud-desktop
    ```

!!! warning
    macOS builds may be **unsigned**. If Gatekeeper blocks the app, run the `xattr` command above, or go to **System Settings → Privacy & Security** and click **Open Anyway**.

---

## Windows

=== "WinGet"

    ```powershell
    winget install Bedrud.BedrudDesktop
    ```

=== "Chocolatey"

    ```powershell
    choco install bedrud-desktop
    ```

=== "NSIS Installer"

    Download the installer from [GitHub Releases](https://github.com/bedrud-ir/bedrud/releases/latest):

    | Architecture | File |
    |---|---|
    | x86_64 | `bedrud-desktop-windows-x86_64-setup.exe` |
    | ARM64 | `bedrud-desktop-windows-arm64-setup.exe` |

    Run the installer. The app appears in Start Menu and Add/Remove Programs.

=== "Portable .zip"

    Download and extract from [GitHub Releases](https://github.com/bedrud-ir/bedrud/releases/latest):

    | Architecture | File |
    |---|---|
    | x86_64 | `bedrud-desktop-windows-x86_64.zip` |
    | ARM64 | `bedrud-desktop-windows-arm64.zip` |

    No installation required — run `bedrud-desktop.exe` from the extracted folder.

---

## Connecting to a Server

When you first open the desktop app, you'll be prompted for a server URL.

1. Enter the URL provided by your server admin (e.g. `https://meet.example.com`)
2. Register an account or sign in
3. Create or join a meeting room

The desktop app supports connecting to **multiple servers**. Add more in **Settings**.

---

## All Downloads

All client installers and binaries are available on the [GitHub Releases](https://github.com/bedrud-ir/bedrud/releases/latest) page.

For the complete reference of all package managers, repositories, and platforms, see the [Package Installation Guide](../guides/packages.md).
