$ErrorActionPreference = "Stop"

$obsoleteMockAnalytics = Join-Path $PSScriptRoot "..\src\features\analytics\mock-analytics.ts"
if (Test-Path $obsoleteMockAnalytics) {
  Remove-Item $obsoleteMockAnalytics -Force
  Write-Host "Removed obsolete src/features/analytics/mock-analytics.ts."
} else {
  Write-Host "No obsolete analytics mock file found."
}
