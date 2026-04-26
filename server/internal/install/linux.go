package install

import (
	"bedrud/internal/utils"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"runtime"

	"gopkg.in/yaml.v3"
)

type installConfigYAML struct {
	Server struct {
		Port           string   `yaml:"port"`
		Host           string   `yaml:"host"`
		EnableTLS      bool     `yaml:"enableTLS"`
		CertFile       string   `yaml:"certFile"`
		KeyFile        string   `yaml:"keyFile"`
		Domain         string   `yaml:"domain"`
		Email          string   `yaml:"email"`
		UseACME        bool     `yaml:"useACME"`
		BehindProxy    bool     `yaml:"behindProxy,omitempty"`
		TrustedProxies []string `yaml:"trustedProxies,omitempty"`
		ProxyHeader    string   `yaml:"proxyHeader,omitempty"`
	} `yaml:"server"`
	Database struct {
		Type string `yaml:"type"`
		Path string `yaml:"path"`
	} `yaml:"database"`
	LiveKit struct {
		Host          string `yaml:"host"`
		InternalHost  string `yaml:"internalHost"`
		APIKey        string `yaml:"apiKey"`
		APISecret     string `yaml:"apiSecret"`
		ConfigPath    string `yaml:"configPath,omitempty"`
		SkipTLSVerify bool   `yaml:"skipTLSVerify"`
		External      bool   `yaml:"external"`
	} `yaml:"livekit"`
	Auth struct {
		JWTSecret     string `yaml:"jwtSecret"`
		SessionSecret string `yaml:"sessionSecret"`
		TokenDuration int    `yaml:"tokenDuration"`
	} `yaml:"auth"`
	Logger struct {
		Level      string `yaml:"level"`
		OutputPath string `yaml:"outputPath"`
	} `yaml:"logger"`
	CORS struct {
		AllowedOrigins   string `yaml:"allowedOrigins"`
		AllowCredentials bool   `yaml:"allowCredentials"`
	} `yaml:"cors"`
}

type livekitConfigYAML struct {
	Port          string            `yaml:"port"`
	BindAddresses []string          `yaml:"bind_addresses"`
	Keys          map[string]string `yaml:"keys"`
	RTC           struct {
		TCPPort       string `yaml:"tcp_port"`
		UDPPort       string `yaml:"udp_port"`
		UseExternalIP bool   `yaml:"use_external_ip"`
		NodeIP        string `yaml:"node_ip"`
	} `yaml:"rtc"`
	TURN struct {
		Enabled  bool   `yaml:"enabled"`
		Domain   string `yaml:"domain"`
		UDPPort  int    `yaml:"udp_port"`
		TLSPort  int    `yaml:"tls_port,omitempty"`
		CertFile string `yaml:"cert_file,omitempty"`
		KeyFile  string `yaml:"key_file,omitempty"`
	} `yaml:"turn"`
	Logging struct {
		JSON  bool   `yaml:"json"`
		Level string `yaml:"level"`
	} `yaml:"logging"`
}

func LinuxInstall(cfg *InstallConfig) error {
	if cfg.Fresh {
		fmt.Println("➜ Fresh install: removing previous deployment...")
		if err := LinuxUninstall(); err != nil {
			return fmt.Errorf("failed to uninstall previous deployment: %w", err)
		}
		fmt.Println()
	}
	if runtime.GOOS != "linux" {
		return fmt.Errorf("only linux is supported")
	}

	isTerm := true
	if stat, err := os.Stdin.Stat(); err != nil {
		isTerm = false
	} else if (stat.Mode() & os.ModeCharDevice) == 0 {
		isTerm = false
	}

	if isTerm {
		promptConfig(os.Stdin, os.Stdout, cfg)
	}

	cfg.SetDefaults()

	fmt.Println("➜ Preparing Bedrud installation...")
	fmt.Println("➜ Using IP:", cfg.OverrideIP)
	if cfg.Domain != "" {
		fmt.Println("➜ Using Domain:", cfg.Domain)
	}

	if err := os.MkdirAll("/etc/bedrud", 0o755); err != nil {
		return fmt.Errorf("failed to create /etc/bedrud: %w", err)
	}
	if err := os.MkdirAll("/var/lib/bedrud", 0o755); err != nil {
		return fmt.Errorf("failed to create /var/lib/bedrud: %w", err)
	}
	if err := os.MkdirAll("/var/lib/bedrud/certs", 0o750); err != nil {
		return fmt.Errorf("failed to create /var/lib/bedrud/certs: %w", err)
	}
	if err := os.MkdirAll("/var/log/bedrud", 0o755); err != nil {
		return fmt.Errorf("failed to create /var/log/bedrud: %w", err)
	}

	if err := createBedrudUser(); err != nil {
		fmt.Printf("⚠ Warning: could not create 'bedrud' user: %v\n", err)
	}

	// Chown directories to bedrud:bedrud
	for _, dir := range []string{"/etc/bedrud", "/var/lib/bedrud", "/var/log/bedrud"} {
		if out, err := exec.Command("chown", "-R", "bedrud:bedrud", dir).CombinedOutput(); err != nil {
			return fmt.Errorf("failed to chown %s: %s %w", dir, string(out), err)
		}
	}

	// 1. Install Bedrud Binary
	selfBytes, err := os.ReadFile("/proc/self/exe")
	if err != nil {
		execPath, errFallback := os.Executable()
		if errFallback != nil {
			return fmt.Errorf("failed to get executable path: %w", errFallback)
		}
		selfBytes, err = os.ReadFile(execPath)
	}
	if err != nil || len(selfBytes) == 0 {
		return fmt.Errorf("failed to read current binary for installation: %w", err)
	}
	if err := os.WriteFile("/usr/local/bin/bedrud", selfBytes, 0o755); err != nil {
		return fmt.Errorf("failed to install binary to /usr/local/bin/bedrud: %w", err)
	}

	apiKey := generateSecret(32)
	apiSecret := generateSecret(48)
	jwtSecret := generateSecret(32)
	sessionSecret := generateSecret(32)

	protocol := "http"
	if cfg.EnableTLS {
		protocol = "https"
	}

	certFile := cfg.CertPath
	if certFile == "" {
		certFile = "/etc/bedrud/cert.pem"
	}
	keyFile := cfg.KeyPath
	if keyFile == "" {
		keyFile = "/etc/bedrud/key.pem"
	}

	hostForLK := cfg.OverrideIP
	if cfg.Domain != "" {
		hostForLK = cfg.Domain
	}

	livekitPublicHost := fmt.Sprintf("%s://%s:%s/livekit", protocol, hostForLK, cfg.Port)
	if cfg.Port == "443" {
		livekitPublicHost = fmt.Sprintf("https://%s/livekit", hostForLK)
	}

	corsOrigins := "*"
	corsCredentials := false
	if cfg.Domain != "" {
		corsOrigins = fmt.Sprintf("%s://%s", protocol, cfg.Domain)
		corsCredentials = true
	}

	isExternalLK := cfg.ExternalLKURL != ""
	hasSeparateLKDomain := cfg.LKDomain != "" && !isExternalLK

	if isExternalLK {
		livekitPublicHost = cfg.ExternalLKURL
	} else if hasSeparateLKDomain {
		livekitPublicHost = fmt.Sprintf("https://%s", cfg.LKDomain)
	}

	// Build config.yaml
	var configYAML installConfigYAML
	configYAML.Server.Port = cfg.Port
	configYAML.Server.Host = "0.0.0.0"
	configYAML.Server.EnableTLS = cfg.EnableTLS
	configYAML.Server.CertFile = certFile
	configYAML.Server.KeyFile = keyFile
	configYAML.Server.Domain = cfg.Domain
	configYAML.Server.Email = cfg.Email
	configYAML.Server.UseACME = (cfg.Email != "" && !cfg.DisableTLS && cfg.Domain != "")

	if cfg.BehindProxy || (!cfg.EnableTLS && cfg.Domain != "") {
		configYAML.Server.BehindProxy = true
		configYAML.Server.TrustedProxies = []string{"127.0.0.1", "::1"}
		configYAML.Server.ProxyHeader = "X-Forwarded-For"
		if !cfg.BehindProxy {
			fmt.Println("⚠ Warning: behindProxy enabled because domain is set without TLS. Defaulting trustedProxies to localhost.")
		}
	}

	configYAML.Database.Type = "sqlite"
	configYAML.Database.Path = "/var/lib/bedrud/bedrud.db"

	configYAML.LiveKit.Host = livekitPublicHost
	configYAML.LiveKit.InternalHost = fmt.Sprintf("http://127.0.0.1:%s", cfg.LKPort)
	if isExternalLK {
		configYAML.LiveKit.InternalHost = livekitPublicHost
	}
	configYAML.LiveKit.APIKey = apiKey
	configYAML.LiveKit.APISecret = apiSecret
	if !isExternalLK {
		configYAML.LiveKit.ConfigPath = "/etc/bedrud/livekit.yaml"
	}
	configYAML.LiveKit.SkipTLSVerify = true
	configYAML.LiveKit.External = isExternalLK || hasSeparateLKDomain

	configYAML.Auth.JWTSecret = jwtSecret
	configYAML.Auth.SessionSecret = sessionSecret
	configYAML.Auth.TokenDuration = 24

	configYAML.Logger.Level = "debug"
	configYAML.Logger.OutputPath = "/var/log/bedrud/bedrud.log"

	configYAML.CORS.AllowedOrigins = corsOrigins
	configYAML.CORS.AllowCredentials = corsCredentials

	configData, err := yaml.Marshal(&configYAML)
	if err != nil {
		return fmt.Errorf("failed to marshal config.yaml: %w", err)
	}
	if err := os.WriteFile("/etc/bedrud/config.yaml", configData, 0o600); err != nil {
		return fmt.Errorf("failed to write config.yaml: %w", err)
	}
	_ = exec.Command("chown", "bedrud:bedrud", "/etc/bedrud/config.yaml").Run()

	// 3. Create LiveKit Config
	if !isExternalLK {
		turnDomain := hostForLK
		if hasSeparateLKDomain {
			turnDomain = cfg.LKDomain
		}

		lkBindAddr := "127.0.0.1"
		if hasSeparateLKDomain {
			lkBindAddr = "0.0.0.0"
		}

		var lkYAML livekitConfigYAML
		lkYAML.Port = cfg.LKPort
		lkYAML.BindAddresses = []string{lkBindAddr}
		lkYAML.Keys = map[string]string{apiKey: apiSecret}
		lkYAML.RTC.TCPPort = cfg.LKTcpPort
		lkYAML.RTC.UDPPort = cfg.LKUdpPort
		lkYAML.RTC.UseExternalIP = false
		lkYAML.RTC.NodeIP = cfg.OverrideIP
		lkYAML.TURN.Enabled = true
		lkYAML.TURN.Domain = turnDomain
		lkYAML.TURN.UDPPort = 3478
		if cfg.EnableTLS {
			lkYAML.TURN.TLSPort = 5349
			lkYAML.TURN.CertFile = certFile
			lkYAML.TURN.KeyFile = keyFile
		}
		lkYAML.Logging.JSON = true
		lkYAML.Logging.Level = "debug"

		lkData, err := yaml.Marshal(&lkYAML)
		if err != nil {
			return fmt.Errorf("failed to marshal livekit.yaml: %w", err)
		}
		if err := os.WriteFile("/etc/bedrud/livekit.yaml", lkData, 0o600); err != nil {
			return fmt.Errorf("failed to write livekit.yaml: %w", err)
		}
		_ = exec.Command("chown", "bedrud:bedrud", "/etc/bedrud/livekit.yaml").Run()
	}

	if cfg.EnableTLS && cfg.CertPath == "" && cfg.KeyPath == "" {
		cp, kp := "/etc/bedrud/cert.pem", "/etc/bedrud/key.pem"
		if _, err := os.Stat(cp); os.IsNotExist(err) {
			if err := utils.GenerateSelfSignedCert(cp, kp); err != nil {
				return fmt.Errorf("failed to generate self-signed cert: %w", err)
			}
		}
	}

	// 4. Detect init system and install services
	initSystem := detectInitSystem()
	fmt.Println("➜ Detected init system:", initSystem)

	serviceCfg := buildServiceConfig(isExternalLK)

	stopAllInitSystems(serviceCfg.Services)
	cleanupStaleServiceFiles(initSystem)

	lkManagedEnv := ""
	bedrudAfter := "network.target"
	if !isExternalLK {
		lkManagedEnv = "\nEnvironment=LIVEKIT_MANAGED=true"
		bedrudAfter = "network.target livekit.service"
	}

	lkService := `[Unit]
Description=Bedrud Video Meeting Server (LiveKit)
Documentation=https://docs.bedrud.com
After=network.target network-online.target
Wants=network-online.target

[Service]
User=bedrud
Group=bedrud
Type=simple
ExecStart=/usr/local/bin/bedrud --livekit --config /etc/bedrud/livekit.yaml
Restart=on-failure
RestartSec=5s
WorkingDirectory=/etc/bedrud
StandardOutput=journal
StandardError=journal
SyslogIdentifier=livekit

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/bedrud /var/log/bedrud /etc/bedrud

[Install]
WantedBy=multi-user.target
`

	serviceContent := fmt.Sprintf(`[Unit]
Description=Bedrud Video Meeting Server
Documentation=https://docs.bedrud.com
After=%s network-online.target
Wants=network-online.target

[Service]
User=bedrud
Group=bedrud
Type=simple
ExecStart=/usr/local/bin/bedrud run --config /etc/bedrud/config.yaml
Restart=on-failure
RestartSec=5s
Environment=CONFIG_PATH=/etc/bedrud/config.yaml%s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bedrud

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/bedrud /var/log/bedrud /etc/bedrud

[Install]
WantedBy=multi-user.target
`, bedrudAfter, lkManagedEnv)

	if err := writeServiceFiles(initSystem, &serviceCfg, bedrudAfter, lkManagedEnv, lkService, serviceContent); err != nil {
		return fmt.Errorf("failed to write service files: %w", err)
	}

	fmt.Println("➜ Enabling and starting services...")
	if err := enableAndStartServices(initSystem, &serviceCfg); err != nil {
		return fmt.Errorf("failed to enable/start services: %w", err)
	}

	fmt.Println("\n✓ Installation complete!")
	fmt.Println("--------------------------------------------------")
	fmt.Println("Generated Secrets (Save these!):")
	fmt.Println("  LiveKit API Key:   ", apiKey)
	fmt.Println("  LiveKit API Secret:", apiSecret)
	fmt.Println("  JWT Secret:        ", jwtSecret)
	fmt.Println("  Session Secret:    ", sessionSecret)
	fmt.Println("--------------------------------------------------")

	accessURL := fmt.Sprintf("%s://%s:%s", protocol, cfg.OverrideIP, cfg.Port)
	if cfg.Port == "443" || cfg.Port == "80" {
		accessURL = fmt.Sprintf("%s://%s", protocol, cfg.OverrideIP)
	}
	fmt.Println("  Access URL: ", accessURL)
	if cfg.Domain != "" {
		fmt.Println("  Domain URL: ", fmt.Sprintf("%s://%s", protocol, cfg.Domain))
	}
	fmt.Println("  LiveKit Host:", livekitPublicHost)
	return nil
}

func promptConfig(r io.Reader, w io.Writer, cfg *InstallConfig) {
	fmt.Fprintln(w, "\n--- Bedrud Configuration ---")

	if cfg.OverrideIP == "" {
		detectedIP := getLocalIP()
		fmt.Fprintf(w, "➜ Detect IP address [%s]: ", detectedIP)
		var inputIP string
		_, _ = fmt.Fscanln(r, &inputIP)

		if inputIP != "" {
			cfg.OverrideIP = inputIP
		} else {
			cfg.OverrideIP = detectedIP
		}
	}

	if cfg.Domain == "" {
		fmt.Fprintf(w, "➜ Enter Domain (leave empty for IP-only): ")
		_, _ = fmt.Fscanln(r, &cfg.Domain)
	}

	if cfg.Domain != "" {
		if cfg.Email == "" {
			fmt.Fprintf(w, "➜ Enter Email for Let's Encrypt: ")
			_, _ = fmt.Fscanln(r, &cfg.Email)
		}
		if cfg.Email != "" && !cfg.DisableTLS {
			cfg.EnableTLS = true
		}
	}

	if cfg.CertPath != "" && cfg.KeyPath != "" && !cfg.DisableTLS {
		cfg.EnableTLS = true
	}

	if cfg.SelfSigned && !cfg.DisableTLS {
		cfg.EnableTLS = true
	}

	if !cfg.EnableTLS && cfg.Email == "" && !cfg.DisableTLS && !cfg.SelfSigned {
		fmt.Fprintf(w, "➜ Enable Self-Signed TLS? [Y/n]: ")
		var secure string
		_, _ = fmt.Fscanln(r, &secure)
		if secure == "" || secure == "y" || secure == "Y" {
			cfg.EnableTLS = true
		}
	}
}

func createBedrudUser() error {
	// Check if user exists
	if _, err := exec.Command("getent", "passwd", "bedrud").Output(); err == nil {
		return nil // Already exists
	}

	// Create system user: no-login, home at /var/lib/bedrud
	cmd := exec.Command("useradd", "-r", "-s", "/usr/sbin/nologin", "-d", "/var/lib/bedrud", "bedrud")
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to create bedrud user: %s %w", string(out), err)
	}
	return nil
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

func LinuxUninstall() error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("only linux is supported")
	}

	fmt.Println("\n--- Bedrud Uninstallation ---")
	fmt.Println("➜ Stopping and disabling services...")

	svcs := []string{"bedrud", "livekit"}

	stopAllInitSystems(svcs)
	disableAllInitSystems(svcs)

	fmt.Println("➜ Removing service files...")
	cleanupAllServiceFiles()

	// Remove binaries
	fmt.Println("➜ Removing binaries...")
	var errs []error
	if err := os.Remove("/usr/local/bin/bedrud"); err != nil && !os.IsNotExist(err) {
		errs = append(errs, fmt.Errorf("failed to remove /usr/local/bin/bedrud: %w", err))
	}
	if err := os.Remove("/tmp/bedrud"); err != nil && !os.IsNotExist(err) {
		errs = append(errs, fmt.Errorf("failed to remove /tmp/bedrud: %w", err))
	}
	if err := os.Remove("/tmp/bedrud-livekit-server"); err != nil && !os.IsNotExist(err) {
		errs = append(errs, fmt.Errorf("failed to remove /tmp/bedrud-livekit-server: %w", err))
	}

	// Remove PID files
	for _, svc := range svcs {
		pidFile := fmt.Sprintf("/var/run/%s.pid", svc)
		if err := os.Remove(pidFile); err != nil && !os.IsNotExist(err) {
			errs = append(errs, fmt.Errorf("failed to remove %s: %w", pidFile, err))
		}
	}

	// Remove config and data
	fmt.Println("➜ Removing configurations and data...")
	if err := os.RemoveAll("/etc/bedrud"); err != nil {
		errs = append(errs, fmt.Errorf("failed to remove /etc/bedrud: %w", err))
	}
	if err := os.RemoveAll("/var/lib/bedrud"); err != nil {
		errs = append(errs, fmt.Errorf("failed to remove /var/lib/bedrud: %w", err))
	}
	if err := os.RemoveAll("/var/log/bedrud"); err != nil {
		errs = append(errs, fmt.Errorf("failed to remove /var/log/bedrud: %w", err))
	}

	if _, err := exec.Command("getent", "passwd", "bedrud").Output(); err == nil {
		fmt.Println("➜ Removing bedrud system user...")
		if out, err := exec.Command("userdel", "-r", "bedrud").CombinedOutput(); err != nil {
			fmt.Printf("⚠ Warning: failed to remove bedrud user: %s %v\n", string(out), err)
		}
	}

	if len(errs) > 0 {
		return errors.Join(errs...)
	}

	fmt.Println("✓ Uninstallation complete!")
	return nil
}
