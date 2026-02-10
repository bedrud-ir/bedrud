package main

import (
	"bedrud/internal/install"
	"bedrud/internal/livekit"
	"bedrud/internal/server"
	"flag"
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	// Support flags like --livekit and --run as requested
	for i := 1; i < len(os.Args); i++ {
		arg := os.Args[i]
		switch arg {
		case "--livekit":
			lkCmd := flag.NewFlagSet("livekit", flag.ExitOnError)
			configPath := lkCmd.String("config", "", "Path to LiveKit config file")
			lkCmd.Parse(os.Args[i+1:])
			if err := livekit.RunLiveKit(*configPath); err != nil {
				fmt.Fprintf(os.Stderr, "LiveKit error: %v\n", err)
				os.Exit(1)
			}
			return
		case "--run":
			runCmd := flag.NewFlagSet("run", flag.ExitOnError)
			configPath := runCmd.String("config", "", "Path to Bedrud config file")
			runCmd.Parse(os.Args[i+1:])
			path := *configPath
			if path == "" {
				path = os.Getenv("CONFIG_PATH")
				if path == "" {
					path = "config.yaml"
				}
			}
			if err := server.Run(path); err != nil {
				fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
				os.Exit(1)
			}
			return
		}
	}

	command := os.Args[1]
	switch command {
	case "server", "run":
		serverCmd := flag.NewFlagSet("server", flag.ExitOnError)
		configPath := serverCmd.String("config", "", "Path to config file")
		serverCmd.Parse(os.Args[2:])

		path := *configPath
		if path == "" {
			path = os.Getenv("CONFIG_PATH")
			if path == "" {
				path = "config.yaml"
			}
		}

		if err := server.Run(path); err != nil {
			fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
			os.Exit(1)
		}

	case "install":
		installCmd := flag.NewFlagSet("install", flag.ExitOnError)
		enableTLS := installCmd.Bool("tls", false, "Enable HTTPS (auto-generate self-signed certificates)")
		ipOverride := installCmd.String("ip", "", "Override detected IP address")
		domainFlag := installCmd.String("domain", "", "Domain for Let's Encrypt")
		emailFlag := installCmd.String("email", "", "Email for Let's Encrypt")
		portFlag := installCmd.String("port", "", "Override default port (default 443 for TLS, 8090 for HTTP)")
		certFlag := installCmd.String("cert", "", "Path to existing certificate file")
		keyFlag := installCmd.String("key", "", "Path to existing private key file")
		lkPortFlag := installCmd.String("lk-port", "", "Override LiveKit API port (default 7880)")
		lkTcpPortFlag := installCmd.String("lk-tcp-port", "", "Override LiveKit RTC TCP port (default 7881)")
		lkUdpPortFlag := installCmd.String("lk-udp-port", "", "Override LiveKit RTC UDP port (default 7882)")
		installCmd.Parse(os.Args[2:])

		if err := install.DebianInstall(*enableTLS, *ipOverride, *domainFlag, *emailFlag, *portFlag, *certFlag, *keyFlag, *lkPortFlag, *lkTcpPortFlag, *lkUdpPortFlag); err != nil {
			fmt.Fprintf(os.Stderr, "Installation error: %v\n", err)
			os.Exit(1)
		}

	case "uninstall":
		if err := install.DebianUninstall(); err != nil {
			fmt.Fprintf(os.Stderr, "Uninstallation error: %v\n", err)
			os.Exit(1)
		}

	case "help":
		printUsage()

	default:
		fmt.Printf("Unknown command: %s\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("Bedrud - Open Source Video Meetings (All-in-One Binary)")
	fmt.Println("\nUsage:")
	fmt.Println("  bedrud <command> [arguments]")
	fmt.Println("  bedrud --livekit --config <path>")
	fmt.Println("  bedrud --run --config <path>")
	fmt.Println("\nCommands:")
	fmt.Println("  run       Start the meeting server")
	fmt.Println("  livekit   Start the embedded LiveKit server")
	fmt.Println("  install   Install Bedrud on a Debian system")
	fmt.Println("            Flags: --tls, --domain, --email, --ip, --port, --cert, --key, --lk-port, --lk-tcp-port, --lk-udp-port")
	fmt.Println("  uninstall Uninstall Bedrud from the system")
	fmt.Println("  help      Show this help message")
}
