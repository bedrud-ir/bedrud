package install

import (
	"fmt"
	"os"
	"os/exec"
)

type serviceConfig struct {
	HasLivekit     bool
	LivekitManaged bool
	ConfigPath     string
	Services       []string
}

var systemdServiceFiles = []string{
	"/etc/systemd/system/bedrud.service",
	"/etc/systemd/system/livekit.service",
	"/etc/systemd/system/multi-user.target.wants/bedrud.service",
	"/etc/systemd/system/multi-user.target.wants/livekit.service",
}

var initdScripts = []string{
	"/etc/init.d/bedrud",
	"/etc/init.d/livekit",
}

const (
	InitSystemSystemd = "systemd"
	InitSystemOpenRC  = "openrc"
	InitSystemSysV    = "sysv"
)

func detectInitSystem() string {
	if _, err := exec.LookPath("systemctl"); err == nil {
		return InitSystemSystemd
	}
	if _, err := os.Stat("/sbin/openrc"); err == nil {
		return InitSystemOpenRC
	}
	return InitSystemSysV
}

func stopAllInitSystems(services []string) {
	for _, svc := range services {
		if _, err := exec.LookPath("systemctl"); err == nil {
			_ = exec.Command("systemctl", "stop", svc).Run()
		}
		_ = exec.Command("service", svc, "stop").Run()
		if _, err := exec.LookPath("rc-service"); err == nil {
			_ = exec.Command("rc-service", svc, "stop").Run()
		}
	}
}

func disableAllInitSystems(services []string) {
	for _, svc := range services {
		if _, err := exec.LookPath("systemctl"); err == nil {
			_ = exec.Command("systemctl", "disable", svc).Run()
		}
		_ = exec.Command("update-rc.d", svc, "remove").Run()
		if _, err := exec.LookPath("rc-update"); err == nil {
			_ = exec.Command("rc-update", "delete", svc, "default").Run()
		}
	}
}

func cleanupStaleServiceFiles(detected string) {
	switch detected {
	case InitSystemSystemd:
		for _, p := range initdScripts {
			_ = os.Remove(p)
		}
	case InitSystemSysV:
		for _, p := range systemdServiceFiles {
			_ = os.Remove(p)
		}
	case InitSystemOpenRC:
		for _, p := range systemdServiceFiles {
			_ = os.Remove(p)
		}
	}
	if detected != InitSystemSystemd {
		if _, err := exec.LookPath("systemctl"); err == nil {
			_ = exec.Command("systemctl", "daemon-reload").Run()
		}
	}
}

func cleanupAllServiceFiles() {
	for _, p := range systemdServiceFiles {
		_ = os.Remove(p)
	}
	for _, p := range initdScripts {
		_ = os.Remove(p)
	}
	if _, err := exec.LookPath("systemctl"); err == nil {
		_ = exec.Command("systemctl", "daemon-reload").Run()
		_ = exec.Command("systemctl", "reset-failed").Run()
	}
}

func buildServiceConfig(isExternalLK bool) serviceConfig {
	cfg := serviceConfig{
		HasLivekit:     !isExternalLK,
		LivekitManaged: !isExternalLK,
		ConfigPath:     "/etc/bedrud/config.yaml",
		Services:       []string{"bedrud"},
	}
	if cfg.HasLivekit {
		cfg.Services = []string{"livekit", "bedrud"}
	}
	return cfg
}

func enableAndStartServices(initSystem string, cfg *serviceConfig) error {
	switch initSystem {
	case InitSystemSystemd:
		return enableStartSystemd(cfg)
	case InitSystemSysV:
		return enableStartSysV(cfg)
	case InitSystemOpenRC:
		return enableStartOpenRC(cfg)
	default:
		return fmt.Errorf("unsupported init system: %s", initSystem)
	}
}

func enableStartSystemd(cfg *serviceConfig) error {
	_ = exec.Command("systemctl", "daemon-reload").Run()
	_ = exec.Command("systemctl", append([]string{"enable"}, cfg.Services...)...).Run()
	_ = exec.Command("systemctl", append([]string{"restart"}, cfg.Services...)...).Run()
	return nil
}

func enableStartSysV(cfg *serviceConfig) error {
	for _, svc := range cfg.Services {
		_ = exec.Command("update-rc.d", svc, "defaults").Run()
	}
	for _, svc := range cfg.Services {
		_ = exec.Command("service", svc, "start").Run()
	}
	return nil
}

func enableStartOpenRC(cfg *serviceConfig) error {
	for _, svc := range cfg.Services {
		_ = exec.Command("rc-update", "add", svc, "default").Run()
	}
	for _, svc := range cfg.Services {
		_ = exec.Command("rc-service", svc, "start").Run()
	}
	return nil
}

func writeServiceFiles(initSystem string, cfg *serviceConfig, bedrudAfter, lkManagedEnv, lkService, serviceContent string) error {
	switch initSystem {
	case InitSystemSystemd:
		return writeSystemdFiles(cfg, lkService, serviceContent)
	case InitSystemSysV:
		return writeSysVFiles(cfg, lkManagedEnv, bedrudAfter)
	case InitSystemOpenRC:
		return writeOpenRCFiles(cfg, lkManagedEnv)
	default:
		return fmt.Errorf("unsupported init system: %s", initSystem)
	}
}

func writeSystemdFiles(cfg *serviceConfig, lkService, serviceContent string) error {
	if cfg.HasLivekit {
		if err := os.WriteFile("/etc/systemd/system/livekit.service", []byte(lkService), 0o644); err != nil {
			return fmt.Errorf("failed to write livekit.service: %w", err)
		}
	}
	if err := os.WriteFile("/etc/systemd/system/bedrud.service", []byte(serviceContent), 0o644); err != nil {
		return fmt.Errorf("failed to write bedrud.service: %w", err)
	}
	return nil
}
