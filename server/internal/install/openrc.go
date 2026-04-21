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
start_stop_daemon_args="--make-pidfile"

depend() {
	need net
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
start_stop_daemon_args="--make-pidfile"

depend() {
	need net
}
`

func writeOpenRCFiles(cfg serviceConfig, lkManagedEnv string) error {
	if cfg.HasLivekit {
		lkScript := openrcLivekitTemplate
		_ = os.WriteFile("/etc/init.d/livekit", []byte(lkScript), 0755)
	}

	lkDep := ""
	if cfg.HasLivekit {
		lkDep = "\tafter livekit"
	}
	bedrudScript := fmt.Sprintf(openrcBedrudTemplate, cfg.ConfigPath, lkDep)
	_ = os.WriteFile("/etc/init.d/bedrud", []byte(bedrudScript), 0755)

	return nil
}
