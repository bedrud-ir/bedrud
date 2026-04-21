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

var allServices = []string{"livekit", "bedrud"}

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

func detectInitSystem() string {
	if _, err := exec.LookPath("systemctl"); err == nil {
		return "systemd"
	}
	if _, err := os.Stat("/sbin/openrc"); err == nil {
		return "openrc"
	}
	return "sysv"
}

func stopAllInitSystems(services []string) {
	for _, svc := range services {
		if _, err := exec.LookPath("systemctl"); err == nil {
			exec.Command("systemctl", "stop", svc).Run()
		}
		exec.Command("service", svc, "stop").Run()
		if _, err := exec.LookPath("rc-service"); err == nil {
			exec.Command("rc-service", svc, "stop").Run()
		}
	}
}

func disableAllInitSystems(services []string) {
	for _, svc := range services {
		if _, err := exec.LookPath("systemctl"); err == nil {
			exec.Command("systemctl", "disable", svc).Run()
		}
		exec.Command("update-rc.d", svc, "remove").Run()
		if _, err := exec.LookPath("rc-update"); err == nil {
			exec.Command("rc-update", "delete", svc, "default").Run()
		}
	}
}

func cleanupStaleServiceFiles(detected string) {
	switch detected {
	case "systemd":
		for _, p := range initdScripts {
			os.Remove(p)
		}
	case "sysv":
		for _, p := range systemdServiceFiles {
			os.Remove(p)
		}
	case "openrc":
		for _, p := range systemdServiceFiles {
			os.Remove(p)
		}
	}
	if detected != "systemd" {
		if _, err := exec.LookPath("systemctl"); err == nil {
			exec.Command("systemctl", "daemon-reload").Run()
		}
	}
}

func cleanupAllServiceFiles() {
	for _, p := range systemdServiceFiles {
		os.Remove(p)
	}
	for _, p := range initdScripts {
		os.Remove(p)
	}
	if _, err := exec.LookPath("systemctl"); err == nil {
		exec.Command("systemctl", "daemon-reload").Run()
		exec.Command("systemctl", "reset-failed").Run()
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

func enableAndStartServices(initSystem string, cfg serviceConfig) error {
	switch initSystem {
	case "systemd":
		return enableStartSystemd(cfg)
	case "sysv":
		return enableStartSysV(cfg)
	case "openrc":
		return enableStartOpenRC(cfg)
	default:
		return fmt.Errorf("unsupported init system: %s", initSystem)
	}
}

func enableStartSystemd(cfg serviceConfig) error {
	exec.Command("systemctl", "daemon-reload").Run()
	exec.Command("systemctl", append([]string{"enable"}, cfg.Services...)...).Run()
	exec.Command("systemctl", append([]string{"restart"}, cfg.Services...)...).Run()
	return nil
}

func enableStartSysV(cfg serviceConfig) error {
	for _, svc := range cfg.Services {
		exec.Command("update-rc.d", svc, "defaults").Run()
	}
	for _, svc := range cfg.Services {
		exec.Command("service", svc, "start").Run()
	}
	return nil
}

func enableStartOpenRC(cfg serviceConfig) error {
	for _, svc := range cfg.Services {
		exec.Command("rc-update", "add", svc, "default").Run()
	}
	for _, svc := range cfg.Services {
		exec.Command("rc-service", svc, "start").Run()
	}
	return nil
}

func writeServiceFiles(initSystem string, cfg serviceConfig, bedrudAfter string, lkManagedEnv string, lkService string, serviceContent string) error {
	switch initSystem {
	case "systemd":
		return writeSystemdFiles(cfg, lkService, serviceContent)
	case "sysv":
		return writeSysVFiles(cfg, lkManagedEnv, bedrudAfter)
	case "openrc":
		return writeOpenRCFiles(cfg, lkManagedEnv)
	default:
		return fmt.Errorf("unsupported init system: %s", initSystem)
	}
}

func writeSystemdFiles(cfg serviceConfig, lkService string, serviceContent string) error {
	if cfg.HasLivekit {
		_ = os.WriteFile("/etc/systemd/system/livekit.service", []byte(lkService), 0644)
	}
	_ = os.WriteFile("/etc/systemd/system/bedrud.service", []byte(serviceContent), 0644)
	return nil
}
