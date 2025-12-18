<#
remove-automatic-download.ps1

Remove a tarefa agendada criada por setup-automatic-download.ps1

Uso:
  .\scripts\remove-automatic-download.ps1 -TaskName ObrasDownload
#>

param(
  [string]$TaskName = "ObrasDownload"
)

Write-Host "Removing scheduled task '$TaskName' if it exists..."
$exists = & schtasks /Query /TN $TaskName 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Task '$TaskName' not found. Nothing to do."
  exit 0
}

schtasks /Delete /TN $TaskName /F
if ($LASTEXITCODE -eq 0) { Write-Host "Task '$TaskName' removed." } else { Write-Error "Failed to remove task. Exit code: $LASTEXITCODE" }
