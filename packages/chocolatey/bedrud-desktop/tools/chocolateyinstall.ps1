$ErrorActionPreference = 'Stop'

$packageName = 'bedrud-desktop'
$toolsDir    = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"

$url64       = 'https://github.com/bedrud-ir/bedrud/releases/download/v0.1.0/bedrud-desktop-windows-x86_64-setup.exe'
$checksum64  = 'CHECKSUM_X86_64'

$packageArgs = @{
  packageName    = $packageName
  fileType       = 'EXE'
  url64bit       = $url64
  checksum64     = $checksum64
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
