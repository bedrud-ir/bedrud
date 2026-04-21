package install

import (
	"fmt"
	"os"
)

const sysvBedrudTemplate = `#!/bin/sh
### BEGIN INIT INFO
# Provides:          bedrud
# Required-Start:    $network %s
# Required-Stop:     $network %s
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Bedrud Meeting Server
# Description:       Bedrud video meeting server
### END INIT INFO

PATH=/sbin:/usr/sbin:/bin:/usr/bin
DAEMON=/usr/local/bin/bedrud
DAEMON_ARGS="run --config %s"
NAME=bedrud
DESC="Bedrud Meeting Server"
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

[ -x "$DAEMON" ] || exit 0

. /lib/lsb/init-functions

do_start() {
	start-stop-daemon --start --quiet --pidfile $PIDFILE --exec $DAEMON --test > /dev/null \
		|| return 1
	start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile \
		--background --exec $DAEMON -- $DAEMON_ARGS \
		|| return 2
}

do_stop() {
	start-stop-daemon --stop --quiet --pidfile $PIDFILE --exec $DAEMON --retry 30 \
		|| return 1
	rm -f $PIDFILE
	return 0
}

case "$1" in
	start)
		log_daemon_msg "Starting $DESC" "$NAME"
		do_start
		case "$?" in
			0|1) log_end_msg 0 ;;
			2)   log_end_msg 1 ;;
		esac
		;;
	stop)
		log_daemon_msg "Stopping $DESC" "$NAME"
		do_stop
		case "$?" in
			0|1) log_end_msg 0 ;;
			2)   log_end_msg 1 ;;
		esac
		;;
	restart)
		log_daemon_msg "Restarting $DESC" "$NAME"
		do_stop
		case "$?" in
			0|1)
				do_start
				case "$?" in
					0) log_end_msg 0 ;;
					*) log_end_msg 1 ;;
				esac
				;;
			*)
				log_end_msg 1
				;;
		esac
		;;
	status)
		status_of_proc -p $PIDFILE "$DAEMON" "$NAME" && exit 0 || exit $?
		;;
	*)
		echo "Usage: $SCRIPTNAME {start|stop|restart|status}" >&2
		exit 3
		;;
esac
:
`

const sysvLivekitTemplate = `#!/bin/sh
### BEGIN INIT INFO
# Provides:          livekit
# Required-Start:    $network
# Required-Stop:     $network
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: LiveKit Server (Embedded in Bedrud)
# Description:       LiveKit media server embedded in Bedrud
### END INIT INFO

PATH=/sbin:/usr/sbin:/bin:/usr/bin
DAEMON=/usr/local/bin/bedrud
DAEMON_ARGS="--livekit --config /etc/bedrud/livekit.yaml"
NAME=livekit
DESC="LiveKit Server (Embedded in Bedrud)"
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

[ -x "$DAEMON" ] || exit 0

. /lib/lsb/init-functions

do_start() {
	start-stop-daemon --start --quiet --pidfile $PIDFILE --exec $DAEMON --test > /dev/null \
		|| return 1
	start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile \
		--background --exec $DAEMON -- $DAEMON_ARGS \
		|| return 2
}

do_stop() {
	start-stop-daemon --stop --quiet --pidfile $PIDFILE --exec $DAEMON --retry 30 \
		|| return 1
	rm -f $PIDFILE
	return 0
}

case "$1" in
	start)
		log_daemon_msg "Starting $DESC" "$NAME"
		do_start
		case "$?" in
			0|1) log_end_msg 0 ;;
			2)   log_end_msg 1 ;;
		esac
		;;
	stop)
		log_daemon_msg "Stopping $DESC" "$NAME"
		do_stop
		case "$?" in
			0|1) log_end_msg 0 ;;
			2)   log_end_msg 1 ;;
		esac
		;;
	restart)
		log_daemon_msg "Restarting $DESC" "$NAME"
		do_stop
		case "$?" in
			0|1)
				do_start
				case "$?" in
					0) log_end_msg 0 ;;
					*) log_end_msg 1 ;;
				esac
				;;
			*)
				log_end_msg 1
				;;
		esac
		;;
	status)
		status_of_proc -p $PIDFILE "$DAEMON" "$NAME" && exit 0 || exit $?
		;;
	*)
		echo "Usage: $SCRIPTNAME {start|stop|restart|status}" >&2
		exit 3
		;;
esac
:
`

func writeSysVFiles(cfg serviceConfig, lkManagedEnv string, bedrudAfter string) error {
	if cfg.HasLivekit {
		lkScript := sysvLivekitTemplate
		_ = os.WriteFile("/etc/init.d/livekit", []byte(lkScript), 0755)
	}

	lkDep := ""
	if cfg.HasLivekit {
		lkDep = "$livekit"
	}
	bedrudScript := fmt.Sprintf(sysvBedrudTemplate, lkDep, lkDep, cfg.ConfigPath)
	_ = os.WriteFile("/etc/init.d/bedrud", []byte(bedrudScript), 0755)

	return nil
}
