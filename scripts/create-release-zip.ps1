param(
  [string]$Output = "linkzzz-release.zip"
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outputPath = if ([System.IO.Path]::IsPathRooted($Output)) {
  $Output
} else {
  Join-Path $projectRoot $Output
}

$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("linkzzz-release-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

$excludedDirectories = @(
  ".git",
  ".next",
  ".linkzzz-data",
  ".idea",
  ".vscode",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
  "public\uploads",
  "src\generated"
)

function Is-ExcludedPath([string]$relativePath) {
  $normalized = $relativePath.Replace("/", "\\").TrimStart("\\")

  foreach ($directory in $excludedDirectories) {
    if ($normalized -eq $directory -or $normalized.StartsWith($directory + "\\", [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  $fileName = [System.IO.Path]::GetFileName($normalized)
  if ($fileName -like ".env*" -and $fileName -ne ".env.example") {
    return $true
  }

  if ($normalized -eq [System.IO.Path]::GetFileName($outputPath)) {
    return $true
  }

  if ($fileName -like "*.zip") {
    return $true
  }

  return $false
}

try {
  Get-ChildItem -Path $projectRoot -File -Recurse -Force | ForEach-Object {
    $relative = $_.FullName.Substring($projectRoot.Length).TrimStart("\\", "/")

    if (-not (Is-ExcludedPath $relative)) {
      $destination = Join-Path $stageRoot $relative
      $destinationDirectory = Split-Path -Parent $destination
      New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
      Copy-Item -Path $_.FullName -Destination $destination -Force
    }
  }

  if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
  }

  $archiveItems = Get-ChildItem -Path $stageRoot -Force | Select-Object -ExpandProperty FullName
  if (-not $archiveItems) {
    throw "Release staging directory is empty."
  }

  Compress-Archive -Path $archiveItems -DestinationPath $outputPath -CompressionLevel Optimal -Force
  Write-Host "Created release archive: $outputPath"
  Write-Host "Excluded: .env*, node_modules, .next, test-results, playwright-report, public/uploads, src/generated, local data and existing ZIPs."
} finally {
  Remove-Item $stageRoot -Recurse -Force -ErrorAction SilentlyContinue
}
