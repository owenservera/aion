@echo off
rem AION Track B local CLI wrapper (read-only chat watch).
rem   aion.cmd chat chief --watch
node "%~dp0aion-local.mjs" %*
exit /b %ERRORLEVEL%
