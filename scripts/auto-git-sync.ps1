$ErrorActionPreference = "Stop"

$repoPath = "C:\Users\Usuari\Documents\BikeRide"
Set-Location $repoPath

# Evita executar si no és un repositori git.
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  exit 0
}

# Actualitza referències remotes; si falla, no bloqueja la següent execució.
git fetch origin *> $null

# Si no hi ha canvis, surt.
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "auto-sync: $timestamp"

git commit -m $message *> $null
if ($LASTEXITCODE -ne 0) {
  exit 0
}

git push origin main *> $null
