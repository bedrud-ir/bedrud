package install

// InstallConfig holds all configuration parameters for the Bedrud installer.
type InstallConfig struct {
	EnableTLS     bool
	DisableTLS    bool
	SelfSigned    bool
	OverrideIP    string
	Domain        string
	Email         string
	Port          string
	CertPath      string
	KeyPath       string
	LKPort        string
	LKTcpPort     string
	LKUdpPort     string
	Fresh         bool
	BehindProxy   bool
	ExternalLKURL string
	LKDomain      string
}

// SetDefaults populates empty fields with their default values.
func (c *InstallConfig) SetDefaults() {
	if c.OverrideIP == "" {
		c.OverrideIP = getLocalIP()
	}
	if c.Port == "" {
		if c.EnableTLS {
			c.Port = "443"
		} else {
			c.Port = "8090"
		}
	}
	if c.LKPort == "" {
		c.LKPort = "7880"
	}
	if c.LKTcpPort == "" {
		c.LKTcpPort = "7881"
	}
	if c.LKUdpPort == "" {
		c.LKUdpPort = "7882"
	}
}
