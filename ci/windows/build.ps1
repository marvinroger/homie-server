# Stop program on error
$ErrorActionPreference = "Stop"

Remove-Item "$PSScriptRoot\sources\bundle\" -Force -Recurse -ErrorAction Ignore
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\sources\bundle\"

# Download latest compatible node in 32 bits
$package = (Get-Content "$PSScriptRoot\..\..\package.json" -Raw) | ConvertFrom-Json
$packageCompatibleNode = $package.engines.node
$latestCompatibleNode = (Invoke-WebRequest "https://semver.io/node/resolve/$packageCompatibleNode").Content
$currentArchitecture = "x86" # If ([Environment]::Is64BitProcess) { "x64" } else { "x86" }
Invoke-WebRequest "https://nodejs.org/dist/v$latestCompatibleNode/win-$currentArchitecture/node.exe" -OutFile "$PSScriptRoot\sources\bundle\node.exe"

# Download NSSM in 32 bits
Invoke-WebRequest "https://nssm.cc/release/nssm-2.24.zip" -OutFile "$PSScriptRoot\sources\bundle\nssm.zip"
$shell = new-object -com shell.application
$nssmZip = $shell.NameSpace("$PSScriptRoot\sources\bundle\nssm.zip")
foreach($item in $nssmZip.items())
{
  $shell.Namespace("$PSScriptRoot\sources\bundle").copyhere($item, 0x14)
}
Copy-Item "$PSScriptRoot\sources\bundle\nssm-2.24\win32\nssm.exe" "$PSScriptRoot\sources\bundle\nssm.exe"
Remove-Item "$PSScriptRoot\sources\bundle\nssm-2.24" -Force -Recurse
Remove-Item "$PSScriptRoot\sources\bundle\nssm.zip" -Force

# Install homie-server
npm install --prefix "$PSScriptRoot\sources\bundle" homie-server
Remove-Item "$PSScriptRoot\sources\bundle\etc" -Force -Recurse
Remove-Item "$PSScriptRoot\sources\bundle\homie" -Force

# Generate the installer
$packageVersion = $package.version
$setupName = "homie-server-v$packageVersion-$currentArchitecture"
& "C:\Program Files (x86)\Inno Setup 5\iscc" /dMySourceDir="$PSScriptRoot\sources" /dMyAppVersion="$packageVersion" /dMyAppOutput="$setupName" $PSScriptRoot\script.iss

# Push the installer to artifacts on Appveyor only
if ($env:APPVEYOR -eq "True") {
  Push-AppveyorArtifact "$PSScriptRoot\output\$setupName.exe" -FileName "$setupName.exe" -DeploymentName "Homie Server v$packageVersion for Windows $currentArchitecture"
}
