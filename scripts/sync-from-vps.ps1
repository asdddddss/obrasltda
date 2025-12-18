<#
  sync-from-vps.ps1
  Sincroniza (puxa) o diretório de uploads do VPS para sua máquina local usando rclone.

  Pré-requisitos:
  - rclone instalado em Windows (https://rclone.org/downloads/)
  - Um remote rclone do tipo "sftp" configurado chamado `vps_sftp` apontando para seu VPS
    Exemplo de criação do remote (substitua host/user/key):
      rclone config create vps_sftp sftp host=1.2.3.4 user=ubuntu port=22 key_file="C:\\Users\\mateu\\.ssh\\id_ed25519"

  Uso (dry-run):
    .\scripts\sync-from-vps.ps1 -DryRun

  Uso (real):
    .\scripts\sync-from-vps.ps1
#>

param(
  [string]$RclonePath = "C:\Program Files\rclone\rclone.exe",
  [string]$RemoteName = "vps_sftp",
  [string]$RemoteDir = "/var/lib/obras/dados",
  [string]$LocalDir = "C:\Users\mateu\obras\dados",
  [switch]$DryRun
)

if (-not (Test-Path $RclonePath)) {
  Write-Error "rclone não encontrado em $RclonePath. Instale o rclone e atualize a variável no cabeçalho do script. https://rclone.org/downloads/"
  exit 1
}

if (-not (Test-Path $LocalDir)) {
  Write-Host "Criando diretório local: $LocalDir"
  New-Item -ItemType Directory -Path $LocalDir -Force | Out-Null
}

$source = "$RemoteName:$RemoteDir"
Write-Host "Fonte: $source"
Write-Host "Destino local: $LocalDir"

$common = @("--progress","--log-file=C:\Users\$env:USERNAME\obras-rclone-sync.log","--log-level=INFO")

if ($DryRun) {
  $args = @("sync", $source, $LocalDir, "--dry-run") + $common
  Write-Host "Executando rclone sync (dry-run)..."
} else {
  $args = @("sync", $source, $LocalDir) + $common
  Write-Host "Executando rclone sync (REAL)..."
}

Write-Host "$RclonePath $($args -join ' ')"
& $RclonePath @args

if ($LASTEXITCODE -ne 0) {
  Write-Error "rclone retornou código $LASTEXITCODE. Verifique o log em C:\Users\$env:USERNAME\obras-rclone-sync.log"
  exit $LASTEXITCODE
}

Write-Host "Sincronização concluída. Verifique C:\Users\$env:USERNAME\obras-rclone-sync.log para detalhes."
