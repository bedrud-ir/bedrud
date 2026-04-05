$ErrorActionPreference = 'Stop'

$packageName = 'bedrud-desktop'

$uninstallKey = Get-UninstallRegistryKey -SoftwareName 'Bedrud Desktop*'

if ($uninstallKey) {
  $uninstallKey | ForEach-Object {
    $file = $_.UninstallString
    Uninstall-ChocolateyPackage -PackageName $packageName `
      -FileType 'EXE' `
      -SilentArgs '/S' `
      -File $file `
      -ValidExitCodes @(0)
  }
} else {
  Write-Warning "$packageName was not found in the registry — may have already been uninstalled."
}
