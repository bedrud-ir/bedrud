package install

import (
	"bedrud/internal/utils"
	"fmt"
	"net"
	"os"
	"os/exec"
	"runtime"
)

func DebianInstall(enableTLS bool, overrideIP string, domainArg string, emailArg string, portArg string, certPathArg string, keyPathArg string, lkPortArg string, lkTcpPortArg string, lkUdpPortArg string) error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("only linux is supported")
	}

	isTerm := true
	if stat, _ := os.Stdin.Stat(); (stat.Mode() & os.ModeCharDevice) == 0 {
		isTerm = false
	}

	// 0. Interactive Prompts
	fmt.Println("\n--- Bedrud Configuration ---")

	ip := overrideIP
	if ip == "" {
		detectedIP := getLocalIP()
		fmt.Printf("➜ Detect IP address [%s]: ", detectedIP)
		var inputIP string
		if isTerm {
			fmt.Scanln(&inputIP)
		} else {
			fmt.Println("(Non-interactive mode, using detected IP)")
		}

		if inputIP != "" {
			ip = inputIP
		} else {
			ip = detectedIP
		}
	}

	domain := domainArg
	if domain == "" && isTerm {
		fmt.Printf("➜ Enter Domain (leave empty for IP-only): ")
		fmt.Scanln(&domain)
	}

	email := emailArg
	useACME := false
	if domain != "" {
		if email == "" && isTerm {
			fmt.Printf("➜ Enter Email for Let's Encrypt: ")
			fmt.Scanln(&email)
		}
		if email != "" {
			useACME = true
			enableTLS = true
		}
	}

	// If providing custom cert/key, we should enable TLS
	if certPathArg != "" && keyPathArg != "" {
		enableTLS = true
	}

	if !enableTLS && !useACME && isTerm {
		fmt.Printf("➜ Enable Self-Signed TLS? [Y/n]: ")
		var secure string
		fmt.Scanln(&secure)
		if secure == "" || secure == "y" || secure == "Y" {
			enableTLS = true
		}
	}

	fmt.Println("➜ Preparing Bedrud installation...")
	fmt.Println("➜ Using IP:", ip)
	if domain != "" {
		fmt.Println("➜ Using Domain:", domain)
	}

	_ = os.MkdirAll("/etc/bedrud", 0755)
	_ = os.MkdirAll("/var/lib/bedrud", 0755)
	_ = os.MkdirAll("/var/lib/bedrud/certs", 0750)
	_ = os.MkdirAll("/var/log/bedrud", 0755)

	// 1. Install Bedrud Binary
	execPath, _ := os.Executable()
	_ = copyFile(execPath, "/usr/local/bin/bedrud")
	os.Chmod("/usr/local/bin/bedrud", 0755)

	protocol := "http"
	if enableTLS {
		protocol = "https"
	}

	apiKey := "bedrud_api_key_system_default_long"
	apiSecret := "bedrud_secret_key_must_be_over_32_characters_for_livekit"

	lkPort := lkPortArg
	if lkPort == "" {
		lkPort = "7880"
	}
	lkTcpPort := lkTcpPortArg
	if lkTcpPort == "" {
		lkTcpPort = "7881"
	}
	lkUdpPort := lkUdpPortArg
	if lkUdpPort == "" {
		lkUdpPort = "7882"
	}

	// 2. Create Bedrud Config
	// We now proxy LiveKit through port 443 /livekit prefix
	port := portArg
	if port == "" {
		port = "443"
		if !enableTLS {
			port = "8090"
		}
	}

	certFile := certPathArg
	if certFile == "" {
		certFile = "/etc/bedrud/cert.pem"
	}
	keyFile := keyPathArg
	if keyFile == "" {
		keyFile = "/etc/bedrud/key.pem"
	}

	hostForLK := ip
	if domain != "" {
		hostForLK = domain
	}

	livekitPublicHost := fmt.Sprintf("%s://%s:%s/livekit", protocol, hostForLK, port)
	if port == "443" {
		livekitPublicHost = fmt.Sprintf("https://%s/livekit", hostForLK)
	}

	configContent := fmt.Sprintf(`server:
  port: "%s"
  host: "0.0.0.0"
  enableTLS: %v
  certFile: "%s"
  keyFile: "%s"
  domain: "%s"
  email: "%s"
  useACME: %v

database:
  type: "sqlite"
  path: "/var/lib/bedrud/bedrud.db"

livekit:
  host: "%s"
  internalHost: "http://127.0.0.1:%s"
  apiKey: "%s"
  apiSecret: "%s"
  configPath: "/etc/bedrud/livekit.yaml"
  skipTLSVerify: true

auth:
  jwtSecret: "bedrud_jwt_secret_at_least_32_chars_long_now"
  sessionSecret: "bedrud_session_secret_at_least_32_chars_long_now"
  tokenDuration: 24

logger:
  level: "debug"
  outputPath: "/var/log/bedrud/bedrud.log"

cors:
  allowedOrigins: "*"
`, port, enableTLS, certFile, keyFile, domain, email, useACME, livekitPublicHost, lkPort, apiKey, apiSecret)

	_ = os.WriteFile("/etc/bedrud/config.yaml", []byte(configContent), 0644)

	// 3. Create LiveKit Config
	// Use explicit node_ip and disable external discovery to avoid LXC network issues
	lkContent := fmt.Sprintf(`port: %s
bind_addresses:
  - 127.0.0.1
keys:
  %s: %s
rtc:
  tcp_port: %s
  udp_port: %s
  use_external_ip: false
  node_ip: %s
logging:
  json: true
  level: debug
`, lkPort, apiKey, apiSecret, lkTcpPort, lkUdpPort, ip)

	_ = os.WriteFile("/etc/bedrud/livekit.yaml", []byte(lkContent), 0644)

	if enableTLS && certPathArg == "" && keyPathArg == "" {
		cp, kp := "/etc/bedrud/cert.pem", "/etc/bedrud/key.pem"
		if _, err := os.Stat(cp); os.IsNotExist(err) {
			_ = utils.GenerateSelfSignedCert(cp, kp)
		}
	}

	// 4. Create Systemd Services
	// LiveKit Service (using bedrud binary)
	lkService := `[Unit]
Description=LiveKit Server (Embedded in Bedrud)
After=network.target

[Service]
ExecStart=/usr/local/bin/bedrud --livekit --config /etc/bedrud/livekit.yaml
Restart=always
WorkingDirectory=/etc/bedrud

[Install]
WantedBy=multi-user.target
`
	_ = os.WriteFile("/etc/systemd/system/livekit.service", []byte(lkService), 0644)

	// Bedrud Service
	serviceContent := `[Unit]
Description=Bedrud Meeting Server
After=network.target livekit.service

[Service]
ExecStart=/usr/local/bin/bedrud --run --config /etc/bedrud/config.yaml
Restart=always
Environment=CONFIG_PATH=/etc/bedrud/config.yaml
Environment=LIVEKIT_MANAGED=true

[Install]
WantedBy=multi-user.target
`
	_ = os.WriteFile("/etc/systemd/system/bedrud.service", []byte(serviceContent), 0644)

	fmt.Println("➜ Enabling and starting services...")
	exec.Command("systemctl", "daemon-reload").Run()
	exec.Command("systemctl", "enable", "livekit", "bedrud").Run()
	exec.Command("systemctl", "restart", "livekit", "bedrud").Run()

	fmt.Println("✓ Installation complete!")
	fmt.Println("  Access URL: ", protocol+"://"+ip+":8090")
	fmt.Println("  LiveKit Host:", livekitPublicHost)
	return nil
}

func copyFile(src, dst string) error {
	input, _ := os.ReadFile(src)
	return os.WriteFile(dst, input, 0644)
}

func getLocalIP() string {
	addrs, _ := net.InterfaceAddrs()
	for _, a := range addrs {
		if ipnet, ok := a.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "127.0.0.1"
}

func DebianUninstall() error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("only linux is supported")
	}

	fmt.Println("\n--- Bedrud Uninstallation ---")
	fmt.Println("➜ Stopping and disabling services...")

	// Stop and disable services
	exec.Command("systemctl", "stop", "bedrud", "livekit").Run()
	exec.Command("systemctl", "disable", "bedrud", "livekit").Run()

	// Remove systemd files
	fmt.Println("➜ Removing systemd services...")
	os.Remove("/etc/systemd/system/bedrud.service")
	os.Remove("/etc/systemd/system/livekit.service")
	os.Remove("/etc/systemd/system/multi-user.target.wants/bedrud.service")
	os.Remove("/etc/systemd/system/multi-user.target.wants/livekit.service")

	exec.Command("systemctl", "daemon-reload").Run()
	exec.Command("systemctl", "reset-failed").Run()

	// Remove binaries
	fmt.Println("➜ Removing binaries...")
	os.Remove("/usr/local/bin/bedrud")
	os.Remove("/tmp/bedrud")
	os.Remove("/tmp/bedrud-livekit-server")

	// Remove config and data
	fmt.Println("➜ Removing configurations and data...")
	os.RemoveAll("/etc/bedrud")
	os.RemoveAll("/var/lib/bedrud")
	os.RemoveAll("/var/log/bedrud")

	fmt.Println("✓ Uninstallation complete!")
	return nil
}
