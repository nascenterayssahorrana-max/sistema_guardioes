# Inicializador direto dentro da pasta do sistema
$ErrorActionPreference = "Stop"
$systemDir = Split-Path -Parent $PSCommandPath

Clear-Host
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  🍝 GUARDIÕES DA LASANHA - SISTEMA INTEGRADO DE GESTÃO FINANCEIRA & CVL  " -ForegroundColor Yellow -BackgroundColor Black
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento Vite..." -ForegroundColor Green

$nodeExe = "C:\Users\nasce\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$viteBin = Join-Path $systemDir "node_modules\vite\bin\vite.js"

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host "✨ Servidor em: http://localhost:3000" -ForegroundColor Green
Write-Host "👉 Pressione Ctrl + C para parar." -ForegroundColor Gray
Write-Host ""

Set-Location -LiteralPath $systemDir
& $nodeExe $viteBin --port 3000 --host 0.0.0.0
