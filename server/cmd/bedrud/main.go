package main

import (
	"bedrud/internal/install"
	"bedrud/internal/livekit"
	"bedrud/internal/server"
	"bedrud/internal/usercli"
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
		enableTLS := installCmd.Bool("tls", false, "Enable HTTPS with self-signed certificate (same as --self-signed)")
		selfSigned := installCmd.Bool("self-signed", false, "Generate and use a self-signed TLS certificate")
		noTLS := installCmd.Bool("no-tls", false, "Disable TLS entirely (plain HTTP, overrides --tls/--self-signed)")
		ipOverride := installCmd.String("ip", "", "Override detected IP address")
		domainFlag := installCmd.String("domain", "", "Domain for Let's Encrypt")
		emailFlag := installCmd.String("email", "", "Email for Let's Encrypt")
		portFlag := installCmd.String("port", "", "Override default port (default 443 for TLS, 8090 for HTTP)")
		certFlag := installCmd.String("cert", "", "Path to existing certificate file")
		keyFlag := installCmd.String("key", "", "Path to existing private key file")
		lkPortFlag := installCmd.String("lk-port", "", "Override LiveKit API port (default 7880)")
		lkTcpPortFlag := installCmd.String("lk-tcp-port", "", "Override LiveKit RTC TCP port (default 7881)")
		lkUdpPortFlag := installCmd.String("lk-udp-port", "", "Override LiveKit RTC UDP port (default 7882)")
		freshFlag := installCmd.Bool("fresh", false, "Remove existing installation before installing")
		behindProxyFlag := installCmd.Bool("behind-proxy", false, "Running behind a CDN/reverse-proxy (Cloudflare, nginx, etc.)")
		externalLKFlag := installCmd.String("external-livekit", "", "URL of a fully external LiveKit server (different machine, e.g. https://lk.example.com)")
		lkDomainFlag := installCmd.String("livekit-domain", "", "Separate domain for the local LiveKit server (e.g. lk.example.com, bypasses CDN)")
		installCmd.Parse(os.Args[2:])

		tls := (*enableTLS || *selfSigned) && !*noTLS
		if err := install.DebianInstall(tls, *noTLS, *selfSigned && !*noTLS, *ipOverride, *domainFlag, *emailFlag, *portFlag, *certFlag, *keyFlag, *lkPortFlag, *lkTcpPortFlag, *lkUdpPortFlag, *freshFlag, *behindProxyFlag, *externalLKFlag, *lkDomainFlag); err != nil {
			fmt.Fprintf(os.Stderr, "Installation error: %v\n", err)
			os.Exit(1)
		}

	case "uninstall":
		if err := install.DebianUninstall(); err != nil {
			fmt.Fprintf(os.Stderr, "Uninstallation error: %v\n", err)
			os.Exit(1)
		}

	case "user":
		userCmd := flag.NewFlagSet("user", flag.ExitOnError)
		configPath := userCmd.String("config", "/etc/bedrud/config.yaml", "Path to Bedrud config file")
		userCmd.Parse(os.Args[2:])

		if len(userCmd.Args()) == 0 {
			fmt.Println("Usage: bedrud user <subcommand> [flags]")
			fmt.Println("  promote --email <email>  Grant superadmin access to a user")
			fmt.Println("  demote  --email <email>  Remove superadmin access from a user")
			os.Exit(1)
		}
		sub := userCmd.Args()[0]
		subCmd := flag.NewFlagSet(sub, flag.ExitOnError)
		emailFlag := subCmd.String("email", "", "User email address")
		subCmd.Parse(userCmd.Args()[1:])

		if *emailFlag == "" {
			fmt.Fprintf(os.Stderr, "Error: --email is required\n")
			os.Exit(1)
		}
		switch sub {
		case "promote":
			if err := usercli.PromoteUser(*configPath, *emailFlag); err != nil {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
				os.Exit(1)
			}
		case "demote":
			if err := usercli.DemoteUser(*configPath, *emailFlag); err != nil {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
				os.Exit(1)
			}
		default:
			fmt.Fprintf(os.Stderr, "Unknown user subcommand: %s\n", sub)
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
	fmt.Println("  install   Install Bedrud on a Debian/Linux system")
	fmt.Println("            Flags: --tls / --self-signed, --no-tls, --domain, --email,")
	fmt.Println("                   --ip, --port, --cert, --key,")
	fmt.Println("                   --lk-port, --lk-tcp-port, --lk-udp-port,")
	fmt.Println("                   --fresh, --behind-proxy,")
	fmt.Println("                   --livekit-domain <domain>  (local LK on its own domain)")
	fmt.Println("                   --external-livekit <url>   (fully separate LK machine)")
	fmt.Println("  uninstall Uninstall Bedrud from the system")
	fmt.Println("  user      Manage users")
	fmt.Println("            promote --email <email>  Grant superadmin access")
	fmt.Println("            demote  --email <email>  Remove superadmin access")
	fmt.Println("  help      Show this help message")
}
