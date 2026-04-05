# Define systemd unit dir if the macro is not provided by the build environment
# (e.g. Ubuntu's rpm package lacks systemd-rpm-macros)
%{!?_unitdir: %define _unitdir /usr/lib/systemd/system}

Name:           bedrud
Version:        VERSION_PLACEHOLDER
Release:        1%{?dist}
Summary:        Self-hosted video meeting server
License:        Apache-2.0
URL:            https://github.com/bedrud-ir/bedrud
BuildArch:      ARCH_PLACEHOLDER

Requires:       glibc

%description
Bedrud is a self-hosted video meeting server that bundles a web UI,
REST API, and LiveKit WebRTC media server in a single binary.
Supports Let's Encrypt TLS and SQLite/PostgreSQL databases.

%install
install -Dm755 bedrud %{buildroot}%{_bindir}/bedrud
install -Dm644 bedrud.service %{buildroot}%{_unitdir}/bedrud.service
install -dm755 %{buildroot}%{_sysconfdir}/bedrud
install -dm755 %{buildroot}%{_sharedstatedir}/bedrud
install -dm755 %{buildroot}/var/log/bedrud

%files
%{_bindir}/bedrud
%{_unitdir}/bedrud.service
%dir %{_sysconfdir}/bedrud
%dir %{_sharedstatedir}/bedrud
%dir /var/log/bedrud

%post
getent group bedrud >/dev/null || groupadd -r bedrud
getent passwd bedrud >/dev/null || \
    useradd -r -g bedrud -s /usr/sbin/nologin -d %{_sharedstatedir}/bedrud bedrud
chown -R bedrud:bedrud %{_sharedstatedir}/bedrud /var/log/bedrud
systemctl daemon-reload >/dev/null 2>&1 || :
echo ""
echo "Bedrud installed. Configure /etc/bedrud/config.yaml"
echo "then run: systemctl enable --now bedrud"
echo "Docs: https://bedrud-ir.github.io/bedrud/"

%preun
if [ $1 -eq 0 ]; then
    systemctl stop bedrud.service >/dev/null 2>&1 || :
    systemctl disable bedrud.service >/dev/null 2>&1 || :
fi

%postun
if [ $1 -eq 0 ]; then
    systemctl daemon-reload >/dev/null 2>&1 || :
fi
