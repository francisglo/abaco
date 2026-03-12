param(
  [string]$Branch = "main",
  [string]$Repo = ""
)

$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'

if (-not (Test-Path $gh)) {
  throw "No se encontró GitHub CLI en $gh"
}

& $gh auth status --hostname github.com | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI no autenticado. Ejecuta: & 'C:\Program Files\GitHub CLI\gh.exe' auth login --hostname github.com --git-protocol https --web"
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $detectedRepo = & $gh repo view --json nameWithOwner --jq .nameWithOwner
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($detectedRepo)) {
    throw "No se pudo detectar el repositorio actual. Pasa -Repo owner/name"
  }
  $Repo = $detectedRepo.Trim()
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  throw "No se pudo determinar el repositorio. Pasa -Repo owner/name"
}

$payload = @{
  required_status_checks = @{
    strict = $true
    contexts = @(
      "Frontend Build",
      "Backend Role Matrix",
      "Platform QA / Frontend Build",
      "Platform QA / Backend Role Matrix"
    )
  }
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismiss_stale_reviews = $true
    required_approving_review_count = 1
    require_code_owner_reviews = $false
  }
  restrictions = $null
  required_linear_history = $false
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
  required_conversation_resolution = $true
} | ConvertTo-Json -Depth 8

$tempFile = [System.IO.Path]::GetTempFileName()
try {
  Set-Content -Path $tempFile -Value $payload -Encoding UTF8
  & $gh api "repos/$Repo/branches/$Branch/protection" --method PUT --input $tempFile | Out-Null
  Write-Host "Protección aplicada en ${Repo}:${Branch}"
}
finally {
  Remove-Item -Path $tempFile -ErrorAction SilentlyContinue
}
