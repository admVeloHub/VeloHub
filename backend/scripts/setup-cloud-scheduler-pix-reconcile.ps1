# VeloHub — Cloud Scheduler: reconciliação pixLiberado (15 min)
# VERSION: v1.0.1 | DATE: 2026-05-26
#
# Header HTTP (Scheduler → Cloud Run):
#   X-Velohub-Pix-Reconcile-Secret: <valor de VELOHUB_PIX_RECONCILE_SECRET>
#
# Uso:
#   .\backend\scripts\setup-cloud-scheduler-pix-reconcile.ps1
#   (lê VELOHUB_PIX_RECONCILE_SECRET de FONTE DA VERDADE\.env se não estiver no ambiente)

$ErrorActionPreference = "Stop"

$PROJECT_ID = "velohub-471220"
$REGION = "us-east1"
$SERVICE_URL = "https://velohub-278491073220.us-east1.run.app"
$JOB_NAME = "velohub-pix-liberado-reconcile-15m"
$SCHEDULE = "*/15 * * * *"
$URI = "$SERVICE_URL/api/escalacoes/solicitacoes/internal/reconciliar-pix-liberado-ouvidoria"
$HEADER_NAME = "X-Velohub-Pix-Reconcile-Secret"

function Read-PixReconcileSecretFromFonteEnv {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $fonteEnv = Join-Path $scriptDir "..\..\..\FONTE DA VERDADE\.env"
  $fonteEnv = [System.IO.Path]::GetFullPath($fonteEnv)
  if (-not (Test-Path $fonteEnv)) { return $null }
  foreach ($line in Get-Content -LiteralPath $fonteEnv -Encoding UTF8) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith("#")) { continue }
    if ($t -match '^\s*VELOHUB_PIX_RECONCILE_SECRET\s*=\s*(.+)\s*$') {
      $raw = $Matches[1].Trim()
      if ($raw.StartsWith('"') -and $raw.EndsWith('"')) { return $raw.Substring(1, $raw.Length - 2) }
      if ($raw.StartsWith("'") -and $raw.EndsWith("'")) { return $raw.Substring(1, $raw.Length - 2) }
      return $raw
    }
  }
  return $null
}

$secret = $env:VELOHUB_PIX_RECONCILE_SECRET
if (-not $secret -or -not $secret.Trim()) {
  $secret = Read-PixReconcileSecretFromFonteEnv
}
if (-not $secret -or -not $secret.Trim()) {
  Write-Error "Defina VELOHUB_PIX_RECONCILE_SECRET no ambiente ou em FONTE DA VERDADE\.env"
}

$secret = $secret.Trim()
$headersArg = "Content-Type=application/json,${HEADER_NAME}=$secret"

Write-Host "Projeto: $PROJECT_ID"
Write-Host "Job: $JOB_NAME (cada 15 min)"
Write-Host "URI: $URI"
Write-Host "Header preparado: ${HEADER_NAME}: <VELOHUB_PIX_RECONCILE_SECRET>"

gcloud config set project $PROJECT_ID | Out-Null

$existing = gcloud scheduler jobs describe $JOB_NAME --location=$REGION 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Atualizando job existente..."
  gcloud scheduler jobs update http $JOB_NAME `
    --location=$REGION `
    --schedule=$SCHEDULE `
    --uri=$URI `
    --http-method=POST `
    --headers=$headersArg `
    --message-body='{"windowHours":48,"limit":100}' `
    --time-zone="America/Sao_Paulo"
} else {
  Write-Host "Criando job..."
  gcloud scheduler jobs create http $JOB_NAME `
    --location=$REGION `
    --schedule=$SCHEDULE `
    --uri=$URI `
    --http-method=POST `
    --headers=$headersArg `
    --message-body='{"windowHours":48,"limit":100}' `
    --time-zone="America/Sao_Paulo"
}

Write-Host "Concluído. Teste manual:"
Write-Host "  gcloud scheduler jobs run $JOB_NAME --location=$REGION"
