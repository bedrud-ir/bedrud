import sys
import os
import click
import subprocess

@click.command()
@click.option('--auto-config', is_flag=True, help='Automatically configure a remote server')
@click.option('--ip', help='IP address of the remote server')
@click.option('--user', default='root', help='SSH user')
@click.option('--auth-key', help='Path to SSH private key')
@click.option('--domain', help='Domain name for Let\'s Encrypt')
@click.option('--acme-email', help='Email for Let\'s Encrypt')
@click.option('--port', help='Override default port')
@click.option('--cert', help='Path to existing certificate file')
@click.option('--key', help='Path to existing private key file')
@click.option('--lk-port', help='Override LiveKit API port')
@click.option('--lk-tcp-port', help='Override LiveKit RTC TCP port')
@click.option('--lk-udp-port', help='Override LiveKit RTC UDP port')
@click.option('--uninstall', is_flag=True, help='Uninstall Bedrud from the remote server')
def main(auto_config, ip, user, auth_key, domain, acme_email, port, cert, key, lk_port, lk_tcp_port, lk_udp_port, uninstall):
    """Bedrud CLI - Management and Deployment tool."""
    if auto_config:
        if not ip:
            click.echo("Error: --ip is required when using --auto-config")
            sys.exit(1)
        
        click.echo(f"➜ Starting auto-config for {ip}...")
        
        # 1. Ensure backend is built and archived
        if not os.path.exists("server/dist/bedrud"):
            click.echo("➜ Backend binary not found. Building...")
            subprocess.run(["make", "build-back"], check=True)
        
        click.echo("➜ Creating tar.xz archive for deployment...")
        archive_path = "server/dist/bedrud.tar.xz"
        subprocess.run(["tar", "-C", "server/dist", "-cJf", archive_path, "bedrud"], check=True)
        
        # 1.5 Ensure rsync is installed on remote (needed for the next step)
        click.echo("➜ Ensuring rsync is installed on remote server...")
        ssh_base = ["ssh", "-o", "StrictHostKeyChecking=no"]
        if auth_key:
            ssh_base.extend(["-i", auth_key])
        
        install_rsync_cmd = [*ssh_base, f"{user}@{ip}", "which rsync || (apt-get update && apt-get install -y rsync)"]
        subprocess.run(install_rsync_cmd, check=False)
        
        # 2. Upload with progress indicator
        click.echo(f"➜ Uploading {archive_path} to {ip}...")
        ssh_cmd = f"ssh -o StrictHostKeyChecking=no"
        if auth_key:
            ssh_cmd += f" -i {auth_key}"
            
        rsync_cmd = [
            "rsync",
            "-avz",
            "--progress",
            "-e", ssh_cmd,
            archive_path,
            f"{user}@{ip}:/tmp/bedrud.tar.xz"
        ]
        subprocess.run(rsync_cmd, check=True)
        
        # 3. Invoke pyinfra for configuration
        env = os.environ.copy()
        env["BEDRUD_IP"] = ip
        env["BEDRUD_USER"] = user
        env["BEDRUD_DOMAIN"] = domain if domain else ""
        env["BEDRUD_EMAIL"] = acme_email if acme_email else ""
        env["BEDRUD_PORT"] = port if port else ""
        env["BEDRUD_CERT"] = cert if cert else ""
        env["BEDRUD_KEY"] = key if key else ""
        env["BEDRUD_LK_PORT"] = lk_port if lk_port else ""
        env["BEDRUD_LK_TCP_PORT"] = lk_tcp_port if lk_tcp_port else ""
        env["BEDRUD_LK_UDP_PORT"] = lk_udp_port if lk_udp_port else ""
        
        cmd = [
            "pyinfra",
            ip,
            "deploy/autoconfig/deploy.py",
            "--user", user,
        ]
        if auth_key:
            cmd.extend(["--key", auth_key])
            
        click.echo(f"➜ Running pyinfra: {' '.join(cmd)}")
        result = subprocess.run(cmd, env=env)
        
        if result.returncode == 0:
            click.echo("✓ Auto-config completed successfully!")
        else:
            click.echo("✗ Auto-config failed.")
            sys.exit(result.returncode)
    elif uninstall:
        if not ip:
            click.echo("Error: --ip is required when using --uninstall")
            sys.exit(1)
        
        click.echo(f"➜ Uninstalling Bedrud from {ip}...")
        
        ssh_base = ["ssh", "-o", "StrictHostKeyChecking=no"]
        if auth_key:
            ssh_base.extend(["-i", auth_key])
        
        # Run the remote uninstall command
        remote_cmd = f"{user}@{ip}"
        uninstall_cmd = [
            *ssh_base,
            remote_cmd,
            "if [ -f /usr/local/bin/bedrud ]; then sudo /usr/local/bin/bedrud uninstall; else echo 'Bedrud binary not found at /usr/local/bin/bedrud. Attempting manual cleanup...'; sudo systemctl stop bedrud livekit 2>/dev/null; sudo systemctl disable bedrud livekit 2>/dev/null; sudo rm -f /etc/systemd/system/bedrud.service /etc/systemd/system/livekit.service; sudo rm -rf /etc/bedrud /var/lib/bedrud /var/log/bedrud /usr/local/bin/bedrud; fi"
        ]
        
        result = subprocess.run(uninstall_cmd)
        if result.returncode == 0:
            click.echo("✓ Uninstallation completed successfully!")
        else:
            click.echo("✗ Uninstallation failed.")
            sys.exit(result.returncode)
    else:
        click.echo("Welcome to Bedrud! Use --help for options.")

if __name__ == "__main__":
    main()
