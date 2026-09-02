$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$criticalFlow = Join-Path $projectRoot "e2e\critical-flow.spec.ts"

if (-not (Test-Path $criticalFlow)) {
  Write-Host "No e2e/critical-flow.spec.ts found. Nothing to repair."
  exit 0
}

$content = Get-Content -Path $criticalFlow -Raw
$updated = $content
$changes = @()

if ($updated.Contains("Premium Plus")) {
  $updated = $updated.Replace("Premium Plus", "Pro")
  $changes += "plan terminology"
}

$signInAgain = 'await page.getByRole("button", { name: "Sign in again" }).click();'
$loginWait = 'await expect(page).toHaveURL(/\/login(?:\?|$)/);'

if ($updated.Contains($signInAgain) -and -not $updated.Contains($loginWait)) {
  $updated = $updated.Replace(
    $signInAgain,
    "$signInAgain`r`n  $loginWait"
  )
  $changes += "post-password-change navigation wait"
}

if ($updated -eq $content) {
  Write-Host "critical-flow.spec.ts already contains current E2E fixes."
  exit 0
}

Set-Content -Path $criticalFlow -Value $updated -Encoding utf8
Write-Host ("Updated e2e/critical-flow.spec.ts: " + ($changes -join ", ") + ".")
