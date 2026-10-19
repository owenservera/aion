#requires -Version 7.0
# Track B local command entry point. No installer, daemon or GitHub Actions.
[CmdletBinding(PositionalBinding=$false)]
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$AionArgs)
$ErrorActionPreference='Stop'
$node=Get-Command node -ErrorAction Stop
$cli=Join-Path $PSScriptRoot 'aion-local.mjs'
if (-not (Test-Path -LiteralPath $cli)) {throw 'AION local CLI missing'}
& $node.Source $cli @AionArgs
exit $LASTEXITCODE
