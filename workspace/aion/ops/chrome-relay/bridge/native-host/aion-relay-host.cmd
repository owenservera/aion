@echo off
rem Launcher for the AION relay native-messaging host.
rem
rem Windows launches a native messaging host with CreateProcess, which cannot
rem execute a .js/.mjs file directly. Chrome reads the `path` field of the host
rem manifest and runs it, so this shim is what that field must point at.
rem
rem Arguments come from Chrome: argv[1] is the calling extension's origin and
rem argv[2..] may include --parent-window. They are forwarded untouched.

setlocal
set "BRIDGE_DIR=%~dp0.."
set "NODE_EXE=node"

"%NODE_EXE%" "%BRIDGE_DIR%\bin\aion-relay-host.mjs" %*
exit /b %ERRORLEVEL%