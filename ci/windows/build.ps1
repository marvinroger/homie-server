$package = (Get-Content "$PSScriptRoot\..\..\package.json" -Raw) | ConvertFrom-Json
$packageCompatibleNode = $package.engines.node
$latestCompatibleNode = (Invoke-WebRequest "https://semver.io/node/resolve/$packageCompatibleNode").Content
$currentArchitecture = "x86" # If ([Environment]::Is64BitProcess) { "x64" } else { "x86" }
Invoke-WebRequest "https://nodejs.org/dist/v$latestCompatibleNode/win-$currentArchitecture/node.exe" -OutFile "$PSScriptRoot\sources\node.exe"
npm install --prefix "$PSScriptRoot\sources" homie-server
$packageVersion = $package.version
$setupName = "homie-server-v$packageVersion-$currentArchitecture"
& "C:\Program Files (x86)\Inno Setup 5\iscc" /dMySourceDir="$PSScriptRoot\sources" /dMyAppVersion="$packageVersion" /dMyAppOutput="$setupName" $PSScriptRoot\script.iss
Push-AppveyorArtifact "$PSScriptRoot\output\$setupName" -FileName "$setupName" -DeploymentName "Homie Server v$packageVersion for Windows $currentArchitecture"
