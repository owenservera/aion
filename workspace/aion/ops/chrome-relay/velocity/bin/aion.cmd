@echo off
rem AION Track B portable Windows launcher, no installation or scheduled task.
node "%~dp0aion-local.mjs" %*
exit /b %ERRORLEVEL%
