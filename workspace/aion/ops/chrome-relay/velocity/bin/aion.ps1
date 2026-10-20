# AION Track B local CLI wrapper (read-only chat watch).
#   .\aion.ps1 chat chief --watch
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CliArgs
)
$entry = Join-Path $PSScriptRoot 'aion-local.mjs'
& node $entry @CliArgs
exit $LASTEXITCODE
