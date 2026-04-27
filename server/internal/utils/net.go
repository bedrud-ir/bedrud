package utils

import "net"

func OutboundIP() net.IP {
	conn, err := net.Dial("udp4", "8.8.8.8:80")
	if err != nil {
		return net.ParseIP("127.0.0.1")
	}
	defer conn.Close()
	return conn.LocalAddr().(*net.UDPAddr).IP
}

func DisplayAddr(host, port string) string {
	if host == "0.0.0.0" || host == "" {
		return OutboundIP().String() + ":" + port
	}
	return host + ":" + port
}
