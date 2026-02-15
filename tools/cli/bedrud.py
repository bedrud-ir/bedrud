import sys
import os
import click
import subprocess

@click.group()
def cli():
    """Bedrud CLI - Management and Documentation tool."""
    pass

@cli.command()
@click.option('--ip', required=True, help='IP address of the remote server')
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
def deploy(ip, user, auth_key, domain, acme_email, port, cert, key, lk_port, lk_tcp_port, lk_udp_port):
    """Automatically configure a remote server."""
    click.echo(f"➜ Starting auto-config for {ip}...")
    
    # Work from project root
    os.chdir("../..")
    
    # 1. Ensure backend is built and archived
    if not os.path.exists("server/dist/bedrud"):
        click.echo("➜ Backend binary not found. Building...")
        subprocess.run(["make", "build-back"], check=True)
    
    click.echo("➜ Creating tar.xz archive for deployment...")
    archive_path = "server/dist/bedrud.tar.xz"
    subprocess.run(["tar", "-C", "server/dist", "-cJf", archive_path, "bedrud"], check=True)
    
    # 1.5 Ensure rsync is installed on remote
    click.echo("➜ Ensuring rsync is installed on remote server...")
    ssh_base = ["ssh", "-o", "StrictHostKeyChecking=no"]
    if auth_key:
        ssh_base.extend(["-i", auth_key])
    
    install_rsync_cmd = [*ssh_base, f"{user}@{ip}", "which rsync || (apt-get update && apt-get install -y rsync)"]
    subprocess.run(install_rsync_cmd, check=False)
    
    # 2. Upload
    click.echo(f"➜ Uploading {archive_path} to {ip}...")
    ssh_cmd = "ssh -o StrictHostKeyChecking=no"
    if auth_key:
        ssh_cmd += f" -i {auth_key}"
        
    rsync_cmd = [
        "rsync", "-avz", "--progress", "-e", ssh_cmd,
        archive_path, f"{user}@{ip}:/tmp/bedrud.tar.xz"
    ]
    subprocess.run(rsync_cmd, check=True)
    
    # 3. Invoke pyinfra
    env = os.environ.copy()
    env.update({
        "BEDRUD_IP": ip,
        "BEDRUD_USER": user,
        "BEDRUD_DOMAIN": domain or "",
        "BEDRUD_EMAIL": acme_email or "",
        "BEDRUD_PORT": port or "",
        "BEDRUD_CERT": cert or "",
        "BEDRUD_KEY": key or "",
        "BEDRUD_LK_PORT": lk_port or "",
        "BEDRUD_LK_TCP_PORT": lk_tcp_port or "",
        "BEDRUD_LK_UDP_PORT": lk_udp_port or ""
    })
    
    cmd = ["pyinfra", ip, "deploy/autoconfig/deploy.py", "--user", user]
    if auth_key:
        cmd.extend(["--key", auth_key])
        
    click.echo(f"➜ Running pyinfra: {' '.join(cmd)}")
    result = subprocess.run(cmd, env=env)
    
    if result.returncode == 0:
        click.echo("✓ Auto-config completed successfully!")
    else:
        click.echo("✗ Auto-config failed.")
        sys.exit(result.returncode)

@cli.command()
@click.option('--ip', required=True, help='IP address of the remote server')
@click.option('--user', default='root', help='SSH user')
@click.option('--auth-key', help='Path to SSH private key')
def uninstall(ip, user, auth_key):
    """Uninstall Bedrud from the remote server."""
    click.echo(f"➜ Uninstalling Bedrud from {ip}...")
    
    ssh_base = ["ssh", "-o", "StrictHostKeyChecking=no"]
    if auth_key:
        ssh_base.extend(["-i", auth_key])
    
    uninstall_script = (
        "if [ -f /usr/local/bin/bedrud ]; then "
        "sudo /usr/local/bin/bedrud uninstall; "
        "else echo 'Bedrud binary not found. Attempting manual cleanup...'; "
        "sudo systemctl stop bedrud livekit 2>/dev/null; "
        "sudo systemctl disable bedrud livekit 2>/dev/null; "
        "sudo rm -f /etc/systemd/system/bedrud.service /etc/systemd/system/livekit.service; "
        "sudo rm -rf /etc/bedrud /var/lib/bedrud /var/log/bedrud /usr/local/bin/bedrud; fi"
    )
    
    cmd = [*ssh_base, f"{user}@{ip}", uninstall_script]
    result = subprocess.run(cmd)
    
    if result.returncode == 0:
        click.echo("✓ Uninstallation completed successfully!")
    else:
        click.echo("✗ Uninstallation failed.")
        sys.exit(result.returncode)

@cli.group()
def doc():
    """Documentation management (MkDocs)."""
    pass

@doc.command(name='build')
def doc_build():
    """Build the documentation."""
    click.echo("➜ Building documentation...")
    # Work from project root where mkdocs.yml is
    os.chdir("../..")
    result = subprocess.run(["python3", "-m", "mkdocs", "build"])
    if result.returncode == 0:
        click.echo("✓ Documentation built successfully in site/")
    else:
        click.echo("✗ Documentation build failed.")
        sys.exit(result.returncode)

@doc.command(name='serve')
@click.option('--port', default=8000, help='Port to serve on')
@click.option('--host', default='0.0.0.0', help='Host to bind to')
def doc_serve(port, host):
    """Serve the documentation for local development."""
    click.echo(f"➜ Serving documentation on http://{host}:{port}...")
    # Work from project root where mkdocs.yml is
    os.chdir("../..")
    try:
        subprocess.run(["python3", "-m", "mkdocs", "serve", "-a", f"{host}:{port}"])
    except KeyboardInterrupt:
        click.echo("\n➜ Stopping documentation server...")

if __name__ == "__main__":
    cli()
