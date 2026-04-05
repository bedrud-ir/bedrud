Name:           bedrud-desktop
Version:        VERSION_PLACEHOLDER
Release:        1%{?dist}
Summary:        Bedrud Desktop — self-hosted video meeting client
License:        Apache-2.0
URL:            https://github.com/bedrud-ir/bedrud
BuildArch:      ARCH_PLACEHOLDER

Requires:       glibc, fontconfig, libxkbcommon, libsecret, alsa-lib

%description
Native desktop client for the Bedrud video meeting platform.
Connect to your self-hosted Bedrud server for secure video meetings.

%install
install -Dm755 bedrud-desktop %{buildroot}%{_bindir}/bedrud-desktop
install -Dm644 bedrud.desktop %{buildroot}%{_datadir}/applications/bedrud.desktop
install -Dm644 bedrud.png \
    %{buildroot}%{_datadir}/icons/hicolor/512x512/apps/bedrud.png

%files
%{_bindir}/bedrud-desktop
%{_datadir}/applications/bedrud.desktop
%{_datadir}/icons/hicolor/512x512/apps/bedrud.png
