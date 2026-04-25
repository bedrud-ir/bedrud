package install

import (
	"fmt"
	"os"
)

const openrcBedrudTemplate = `#!/sbin/openrc-run

name="bedrud"
description="Bedrud Meeting Server"
command="/usr/local/bin/bedrud"
command_args="run --config %s"
pidfile="/var/run/${RC_SVCNAME}.pid"
command_background="yes"
start_stop_daemon_args="--make-pidfile --user bedrud:bedrud --chdir /etc/bedrud"
output_log="/var/log/bedrud/bedrud.log"
error_log="/var/log/bedrud/bedrud.log"

depend() {
	need net
%s
}

start_pre() {
%s
}
`

const openrcLivekitTemplate = `#!/sbin/openrc-run

name="livekit"
description="LiveKit Server (Embedded in Bedrud)"
command="/usr/local/bin/bedrud"
command_args="--livekit --config /etc/bedrud/livekit.yaml"
pidfile="/var/run/${RC_SVCNAME}.pid"
command_background="yes"
start_stop_daemon_args="--make-pidfile --user bedrud:bedrud --chdir /etc/bedrud"
output_log="/var/log/bedrud/bedrud.log"
error_log="/var/log/bedrud/bedrud.log"

depend() {
	need net
}
`

func writeOpenRCFiles(cfg serviceConfig, lkManagedEnv string) error {
	if cfg.HasLivekit {
		if err := os.WriteFile("/etc/init.d/livekit", []byte(openrcLivekitTemplate), 0755); err != nil {
			return fmt.Errorf("failed to write livekit openrc script: %w", err)
		}
	}

	lkDep := ""
	if cfg.HasLivekit {
		lkDep = "\tafter livekit"
	}

	envExports := "\texport CONFIG_PATH=" + cfg.ConfigPath
	if lkManagedEnv != "" {
		envExports += "\n\texport LIVEKIT_MANAGED=true"
	}

	bedrudScript := fmt.Sprintf(openrcBedrudTemplate, cfg.ConfigPath, lkDep, envExports)
	if err := os.WriteFile("/etc/init.d/bedrud", []byte(bedrudScript), 0755); err != nil {
		return fmt.Errorf("failed to write bedrud openrc script: %w", err)
	}

	return nil
}
