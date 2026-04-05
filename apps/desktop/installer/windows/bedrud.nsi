; Bedrud Desktop — NSIS Installer
; Usage: makensis /DARCH=x64 bedrud.nsi   (or ARCH=arm64)

!ifndef ARCH
  !define ARCH "x64"
!endif

!define APPNAME    "Bedrud Desktop"
!define APPSLUG    "Bedrud"
!define PUBLISHER  "Bedrud"
!define APPEXE     "bedrud-desktop.exe"

Name "${APPNAME}"
OutFile "bedrud-desktop-setup-${ARCH}.exe"
InstallDir "$PROGRAMFILES64\${APPSLUG}"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

; Pages
Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Main" SecMain
  SetOutPath $INSTDIR
  File "${APPEXE}"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\${APPSLUG}.lnk" "$INSTDIR\${APPEXE}"

  ; Start Menu
  CreateDirectory "$SMPROGRAMS\${APPSLUG}"
  CreateShortcut "$SMPROGRAMS\${APPSLUG}\${APPNAME}.lnk" "$INSTDIR\${APPEXE}"
  CreateShortcut "$SMPROGRAMS\${APPSLUG}\Uninstall.lnk"  "$INSTDIR\uninstall.exe"

  ; Uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Add/Remove Programs registry entry
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud" \
    "DisplayName"    "${APPNAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud" \
    "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud" \
    "Publisher"      "${PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud" \
    "DisplayIcon"    "$INSTDIR\${APPEXE}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud" \
    "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud" \
    "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${APPEXE}"
  Delete "$INSTDIR\uninstall.exe"
  Delete "$DESKTOP\${APPSLUG}.lnk"
  Delete "$SMPROGRAMS\${APPSLUG}\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPSLUG}\Uninstall.lnk"
  RMDir  "$SMPROGRAMS\${APPSLUG}"
  RMDir  "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Bedrud"
SectionEnd
