#requires -Version 7.0
# AION Track B local command entry point. No daemon or GitHub Actions.
# Preserve verbatim CLI arguments such as --apply, --uninstall and --wait-ms.
$ErrorActionPreference = 'Stop'
$node = Get-Command node -ErrorAction Stop
$cli = Join-Path $PSScriptRoot 'aion-local.mjs'
if (-not (Test-Path -LiteralPath $cli)) { throw 'AION local CLI missing' }
& $node.Source $cli @args
exit $LASTEXITCODE
