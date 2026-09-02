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

# Next dev/RSC routes can keep background requests open; networkidle is both slow and
# flaky for this golden path. DOMContentLoaded plus explicit assertions is the stable contract.
if ($updated.Contains('waitUntil: "networkidle"')) {
  $updated = $updated.Replace('waitUntil: "networkidle"', 'waitUntil: "domcontentloaded"')
  $changes += "stable navigation waits"
}

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


$legacyCardPattern = '(?ms)^\s*await page\.goto\("/dashboard/links", \{ waitUntil: "networkidle" \}\);\s*\r?\n\s*await page\.getByRole\("button", \{ name: "Add link" \}\)\.click\(\);\s*\r?\n\s*await expect\(page\.getByRole\("heading", \{ name: "Create link" \}\)\)\.toBeVisible\(\);'

$currentCardFlow = @'
  await page.goto("/dashboard/links", { waitUntil: "domcontentloaded" });
  const provisionedSmartLink = page.getByRole("article").first();
  await expect(provisionedSmartLink).toBeVisible();
  await provisionedSmartLink.getByRole("link", { name: /Edit/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+$/);

  const editorNavigation = page.locator('nav[data-editor-navigation="sidebar"]');
  await expect(editorNavigation).toBeVisible();
  await editorNavigation.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Cards", exact: true }).click();
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create link", exact: true })).toBeVisible();
'@

$legacyCardRegex = [regex]::new($legacyCardPattern)
if ($legacyCardRegex.IsMatch($updated)) {
  $updated = $legacyCardRegex.Replace($updated, $currentCardFlow, 1)
  $changes += "Smart Link card-editor navigation"
}

if ($updated.Contains("publishes a profile and records analytics")) {
  $updated = $updated.Replace("publishes a profile and records analytics", "publishes a Smart Link and records analytics")
  $changes += "critical-flow terminology"
}



$strongPermanentPasswordPattern = '(?m)^\s*const permanentPassword\s*=\s*[^;]+;\s*$'
$strongPermanentPasswordReplacement = '  const permanentPassword = "LinkzzzE2E!2026";'
$strongPermanentPasswordRegex = [regex]::new($strongPermanentPasswordPattern)
if ($strongPermanentPasswordRegex.IsMatch($updated) -and -not $updated.Contains($strongPermanentPasswordReplacement)) {
  $updated = $strongPermanentPasswordRegex.Replace($updated, $strongPermanentPasswordReplacement, 1)
  $changes += "stable strong permanent password"
}

$legacyPasswordSuccessPattern = '(?ms)^\s*await page\.getByRole\("button", \{ name: "Change password" \}\)\.click\(\);\s*\r?\n\s*await expect\(page\.getByText\("Password changed", \{ exact: true \}\)\)\.toBeVisible\(\);\s*\r?\n\s*await page\.getByRole\("button", \{ name: "Sign in again" \}\)\.click\(\);'
$currentPasswordSuccessFlow = @'
  const changePasswordButton = page.getByRole("button", { name: "Change password" });
  await expect(changePasswordButton).toBeEnabled();
  const passwordChangeResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/change-password") &&
      response.request().method() === "POST",
  );
  await changePasswordButton.click();
  const passwordChangeResponse = await passwordChangeResponsePromise;
  const passwordChangePayload = await passwordChangeResponse.json().catch(() => ({}));
  if (!passwordChangeResponse.ok()) {
    throw new Error(
      `Password change failed (${passwordChangeResponse.status()}): ${passwordChangePayload.error ?? "Unknown error"}`,
    );
  }
  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  await expect(
    page.getByText("Password changed. Sign in again with your new password.", { exact: true }),
  ).toBeVisible();
'@
$legacyPasswordSuccessRegex = [regex]::new($legacyPasswordSuccessPattern)
if ($legacyPasswordSuccessRegex.IsMatch($updated)) {
  $updated = $legacyPasswordSuccessRegex.Replace($updated, $currentPasswordSuccessFlow, 1)
  $changes += "password-change redirect contract"
}


$currentPasswordFlowWithoutReadyCheck = @'
  const passwordChangeResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/change-password") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Change password" }).click();
'@
$currentPasswordFlowWithReadyCheck = @'
  const changePasswordButton = page.getByRole("button", { name: "Change password" });
  await expect(changePasswordButton).toBeEnabled();
  const passwordChangeResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/change-password") &&
      response.request().method() === "POST",
  );
  await changePasswordButton.click();
'@
if ($updated.Contains($currentPasswordFlowWithoutReadyCheck)) {
  $updated = $updated.Replace($currentPasswordFlowWithoutReadyCheck, $currentPasswordFlowWithReadyCheck)
  $changes += "password-change hydration readiness"
}

if ($updated -eq $content) {
  Write-Host "critical-flow.spec.ts already contains current E2E fixes."
  exit 0
}

Set-Content -Path $criticalFlow -Value $updated -Encoding utf8
Write-Host ("Updated e2e/critical-flow.spec.ts: " + ($changes -join ", ") + ".")
