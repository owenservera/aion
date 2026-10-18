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
rem Chrome's inherited PATH need not match the interactive terminal's PATH.
set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if defined AION_NODE_EXE set "NODE_EXE=%AION_NODE_EXE%"
if not exist "%NODE_EXE%" (
  >&2 echo aion-relay-host: Node executable not found; configure AION_NODE_EXE.
  exit /b 3
)

"%NODE_EXE%" "%BRIDGE_DIR%\bin\aion-relay-host.mjs" %*
exit /b %ERRORLEVEL%
