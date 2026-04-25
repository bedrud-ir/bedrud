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

# Compat Shim
if [ -f /lib/lsb/init-functions ]; then
    . /lib/lsb/init-functions
    start_daemon() {
        start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile \
            --background --chuid bedrud:bedrud --exec $DAEMON -- "$@"
    }
    stop_daemon() {
        start-stop-daemon --stop --quiet --pidfile $PIDFILE --exec $DAEMON --retry 30
    }
    log_msg() { log_daemon_msg "$1" "$NAME"; }
    log_end() { log_end_msg "$1"; }
elif [ -f /etc/rc.d/init.d/functions ]; then
    . /etc/rc.d/init.d/functions
    start_daemon() {
        daemon --pidfile=$PIDFILE --user=bedrud "nohup $DAEMON $@ > /dev/null 2>&1 &"
        [ $? -eq 0 ] && touch /var/lock/subsys/$NAME
    }
    stop_daemon() {
        killproc -p $PIDFILE "$DAEMON"
        rm -f /var/lock/subsys/$NAME
    }
    log_msg() { echo -n "$1: "; }
    log_end() { [ "$1" -eq 0 ] && echo "OK" || echo "FAILED"; }
else
    start_daemon() {
        sudo -u bedrud nohup "$DAEMON" "$@" > /dev/null 2>&1 &
        echo $! > $PIDFILE
    }
    stop_daemon() {
        kill $(cat $PIDFILE) 2>/dev/null
    }
    log_msg() { echo -n "$1: "; }
    log_end() { [ "$1" -eq 0 ] && echo "OK" || echo "FAILED"; }
fi

%s

do_start() {
    cd /etc/bedrud
    start_daemon $DAEMON_ARGS || return 2
}

do_stop() {
    stop_daemon || return 1
    rm -f $PIDFILE
    return 0
}

case "$1" in
	start)
		log_msg "Starting $DESC"
		do_start
		log_end $?
		;;
	stop)
		log_msg "Stopping $DESC"
		do_stop
		log_end $?
		;;
	restart)
		$0 stop
		sleep 1
		$0 start
		;;
	status)
		if [ -f /lib/lsb/init-functions ]; then
            status_of_proc -p $PIDFILE "$DAEMON" "$NAME" && exit 0 || exit $?
        elif [ -f /etc/rc.d/init.d/functions ]; then
            status -p $PIDFILE "$DAEMON"
        else
            if [ -f $PIDFILE ] && kill -0 $(cat $PIDFILE) 2>/dev/null; then
                echo "$NAME is running"
                exit 0
            else
                echo "$NAME is stopped"
                exit 1
            fi
        fi
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

# Compat Shim
if [ -f /lib/lsb/init-functions ]; then
    . /lib/lsb/init-functions
    start_daemon() {
        start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile \
            --background --chuid bedrud:bedrud --exec $DAEMON -- "$@"
    }
    stop_daemon() {
        start-stop-daemon --stop --quiet --pidfile $PIDFILE --exec $DAEMON --retry 30
    }
    log_msg() { log_daemon_msg "$1" "$NAME"; }
    log_end() { log_end_msg "$1"; }
elif [ -f /etc/rc.d/init.d/functions ]; then
    . /etc/rc.d/init.d/functions
    start_daemon() {
        daemon --pidfile=$PIDFILE --user=bedrud "nohup $DAEMON $@ > /dev/null 2>&1 &"
        [ $? -eq 0 ] && touch /var/lock/subsys/$NAME
    }
    stop_daemon() {
        killproc -p $PIDFILE "$DAEMON"
        rm -f /var/lock/subsys/$NAME
    }
    log_msg() { echo -n "$1: "; }
    log_end() { [ "$1" -eq 0 ] && echo "OK" || echo "FAILED"; }
else
    start_daemon() {
        sudo -u bedrud nohup "$DAEMON" "$@" > /dev/null 2>&1 &
        echo $! > $PIDFILE
    }
    stop_daemon() {
        kill $(cat $PIDFILE) 2>/dev/null
    }
    log_msg() { echo -n "$1: "; }
    log_end() { [ "$1" -eq 0 ] && echo "OK" || echo "FAILED"; }
fi

do_start() {
    cd /etc/bedrud
    start_daemon $DAEMON_ARGS || return 2
}

do_stop() {
    stop_daemon || return 1
    rm -f $PIDFILE
    return 0
}

case "$1" in
	start)
		log_msg "Starting $DESC"
		do_start
		log_end $?
		;;
	stop)
		log_msg "Stopping $DESC"
		do_stop
		log_end $?
		;;
	restart)
		$0 stop
		sleep 1
		$0 start
		;;
	status)
		if [ -f /lib/lsb/init-functions ]; then
            status_of_proc -p $PIDFILE "$DAEMON" "$NAME" && exit 0 || exit $?
        elif [ -f /etc/rc.d/init.d/functions ]; then
            status -p $PIDFILE "$DAEMON"
        else
            if [ -f $PIDFILE ] && kill -0 $(cat $PIDFILE) 2>/dev/null; then
                echo "$NAME is running"
                exit 0
            else
                echo "$NAME is stopped"
                exit 1
            fi
        fi
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
		if err := os.WriteFile("/etc/init.d/livekit", []byte(sysvLivekitTemplate), 0755); err != nil {
			return fmt.Errorf("failed to write livekit init script: %w", err)
		}
	}

	lkDep := ""
	if cfg.HasLivekit {
		lkDep = "$livekit"
	}

	envExports := "export CONFIG_PATH=" + cfg.ConfigPath
	if lkManagedEnv != "" {
		envExports += "\nexport LIVEKIT_MANAGED=true"
	}

	bedrudScript := fmt.Sprintf(sysvBedrudTemplate, lkDep, lkDep, cfg.ConfigPath, envExports)
	if err := os.WriteFile("/etc/init.d/bedrud", []byte(bedrudScript), 0755); err != nil {
		return fmt.Errorf("failed to write bedrud init script: %w", err)
	}

	return nil
}
