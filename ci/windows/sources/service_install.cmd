"%~dp0\nssm.exe" install "Homie Server" "%~dp0\homie.cmd" "--uiPort 35589 --dataDir ""%appdata%\Homie Server"""
"%~dp0\nssm.exe" set "Homie Server" AppStdout "%~dp0\log.txt"
"%~dp0\nssm.exe" set "Homie Server" AppStderr "%~dp0\log.txt"
"%~dp0\nssm.exe" start "Homie Server"
