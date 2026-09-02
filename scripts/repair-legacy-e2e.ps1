$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$criticalFlow = Join-Path $projectRoot "e2e\critical-flow.spec.ts"

if (-not (Test-Path $criticalFlow)) {
  Write-Host "No e2e/critical-flow.spec.ts found. Nothing to repair."
  exit 0
}

$content = Get-Content -Path $criticalFlow -Raw
$updated = $content.Replace("Premium Plus", "Pro")

if ($updated -eq $content) {
  Write-Host "critical-flow.spec.ts already uses current plan terminology."
  exit 0
}

Set-Content -Path $criticalFlow -Value $updated -Encoding utf8
Write-Host "Updated legacy 'Premium Plus' references to 'Pro' in e2e/critical-flow.spec.ts."
