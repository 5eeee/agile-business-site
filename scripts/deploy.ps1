#Requires -Version 5.1
<#
.SYNOPSIS
  Деплой на VPS по SSH/SCP (аналог WinSCP, но из консоли).

.DESCRIPTION
  Запросит хост, пользователя, порт и путь на сервере.
  Режимы:
    1 — только статика public/ (перезапуск Node не нужен для смены CSS/JS/HTML)
    2 — архив проекта без node_modules / .git, распаковка на сервере
  Пароль (или ключ) — как у обычного ssh/scp: вводится при запросе OpenSSH.

  Перед первым запуском (опционально):
    Copy-Item scripts\deploy.example.local.ps1 scripts\deploy.local.ps1
    Отредактируйте deploy.local.ps1 — подставятся значения по умолчанию.

.EXAMPLE
  cd C:\path\to\AgileBusinessVisitca
  .\scripts\deploy.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..')).Path

$DefaultHost = ''
$DefaultUser = 'root'
$DefaultPort = '22'
$DefaultIdentity = ''
$DefaultRemoteRoot = ''

$localCfg = Join-Path $ScriptDir 'deploy.local.ps1'
if (Test-Path $localCfg) {
    . $localCfg
}

function Get-Cmd([string]$Name) {
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    return $cmd.Source
}

function Read-PromptLine([string]$label, [string]$default) {
    if ([string]::IsNullOrEmpty($default)) {
        return (Read-Host $label).Trim()
    }
    $v = Read-Host "$label [$default]"
    $v = $v.Trim()
    if ([string]::IsNullOrWhiteSpace($v)) { return $default }
    return $v
}

$sshExe = Get-Cmd 'ssh.exe'
if (-not $sshExe) { $sshExe = Get-Cmd 'ssh' }
$scpExe = Get-Cmd 'scp.exe'
if (-not $scpExe) { $scpExe = Get-Cmd 'scp' }

if (-not $sshExe -or -not $scpExe) {
    Write-Host 'Не найдены ssh/scp. Включите: Параметры → Приложения → Доп. компоненты → Клиент OpenSSH.' -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Деплой Agile Business → VPS ===" -ForegroundColor Cyan
Write-Host "Репозиторий: $RepoRoot`n"

$hostRemote = Read-PromptLine 'SSH Host (IP или домен)' $DefaultHost
$user = Read-PromptLine 'SSH User' $DefaultUser
$portStr = Read-PromptLine 'SSH Port' $DefaultPort
[int]$port = 22
if (-not [int]::TryParse($portStr, [ref]$port)) { $port = 22 }

$identity = Read-PromptLine 'Путь к приватному ключу (оставьте пустым — пароль или ssh-agent)' $DefaultIdentity
$remoteRoot = Read-PromptLine 'Каталог приложения на сервере (где лежит server.js)' $DefaultRemoteRoot

if ([string]::IsNullOrWhiteSpace($hostRemote) -or [string]::IsNullOrWhiteSpace($user) -or [string]::IsNullOrWhiteSpace($remoteRoot)) {
    Write-Host 'Нужно заполнить host, user и путь на сервере.' -ForegroundColor Red
    exit 1
}

$SshBase = @()
$ScpBase = @()
if ($port -ne 22) {
    $SshBase += @('-p', "$port")
    $ScpBase += @('-P', "$port")
}
if (-not [string]::IsNullOrWhiteSpace($identity)) {
    if (-not (Test-Path -LiteralPath $identity)) {
        Write-Host "Файл ключа не найден: $identity" -ForegroundColor Red
        exit 1
    }
    $SshBase += @('-i', $identity)
    $ScpBase += @('-i', $identity)
}

$remoteRootNorm = $remoteRoot.TrimEnd('/')

Write-Host @"

Выберите режим:
  1 — только public/ → $remoteRootNorm/public/
  2 — весь проект (без node_modules, .git) → архив на сервер, распаковка в $remoteRootNorm/

"@ -ForegroundColor Gray

$mode = Read-Host 'Режим [1/2]'
$mode = $mode.Trim()

$runRemoteAfter = ''
if ($mode -eq '2') {
    $runRemoteAfter = Read-Host "Команды на сервере после распаковки (Enter — пропустить). Например: npm ci --omit=dev && pm2 restart agile)"
}

if ($null -eq $runRemoteAfter) { $runRemoteAfter = '' }

function Invoke-SshRemote([string]$bashOneLiner) {
    $target = "{0}@{1}" -f $user, $hostRemote
    $argsToUse = @() + $SshBase + $target + $bashOneLiner
    Write-Host "`n>>> ssh $($argsToUse -join ' ')" -ForegroundColor DarkGray
    & $sshExe @argsToUse
    if ($LASTEXITCODE -ne 0) { throw "ssh завершился с кодом $LASTEXITCODE" }
}

function Invoke-Scp([string[]]$ScpTrailingArgs) {
    $argsToUse = @() + $ScpBase + $ScpTrailingArgs
    Write-Host "`n>>> scp ..." -ForegroundColor DarkGray
    & $scpExe @argsToUse
    if ($LASTEXITCODE -ne 0) { throw "scp завершился с кодом $LASTEXITCODE" }
}

Push-Location $RepoRoot

try {
    if ($mode -eq '1') {
        $pubLocal = Join-Path $RepoRoot 'public'
        if (-not (Test-Path -LiteralPath $pubLocal)) { throw 'Локально нет папки public/' }

        Write-Host "`nПодготовка каталога на сервере..."
        Invoke-SshRemote "mkdir -p `"$remoteRootNorm`""

        Write-Host "`nЗагрузка всей папки public в $remoteRootNorm/public ..."
        $scpDest = '{0}@{1}:{2}/' -f $user, $hostRemote, $remoteRootNorm
        Invoke-Scp @('-r', $pubLocal, $scpDest)

        Write-Host "`nГотово: статика залита в $remoteRootNorm/public/`nЕсли нужен перезапуск Node под правки только в public — не обязательно.`n" -ForegroundColor Green
    }
    elseif ($mode -eq '2') {
        $tar = Get-Cmd 'tar.exe'
        if (-not $tar) { $tar = Get-Cmd 'tar' }
        if (-not $tar) { throw 'Нужна утилита tar (есть в Windows 10+) для сборки архива.' }

        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $arcName = "deploy-$stamp.tgz"
        $arcPath = Join-Path $env:TEMP $arcName

        if (Test-Path -LiteralPath $arcPath) { Remove-Item -LiteralPath $arcPath -Force }

        Write-Host "`nСборка архива (исключены node_modules, .git, backups, uploads)..."
        & $tar @(
            '--exclude=node_modules',
            '--exclude=.git',
            '--exclude=backups',
            '--exclude=public/uploads',
            '--exclude=.env',
            '-czf', $arcPath,
            '-C', $RepoRoot,
            '.'
        )
        if ($LASTEXITCODE -ne 0) { throw 'tar не собрал архив' }

        $remoteArc = "/tmp/$arcName"
        Write-Host "`nЗагрузка архива на сервер..."
        Invoke-Scp @($arcPath, ('{0}@{1}:{2}' -f $user, $hostRemote, $remoteArc))

        Write-Host "`nРаспаковка на сервере (существующие файлы перезаписываются)..."
        $extract = "set -e; cd `"$remoteRootNorm`" && tar xzf `"$remoteArc`" && rm -f `"$remoteArc`""
        Invoke-SshRemote $extract

        if (-not [string]::IsNullOrWhiteSpace($runRemoteAfter)) {
            Write-Host "`nВыполнение команд на сервере..."
            Invoke-SshRemote "cd `"$remoteRootNorm`" && $runRemoteAfter"
        }

        Write-Host "`nГотово: проект обновлён в $remoteRootNorm`n" -ForegroundColor Green
    }
    else {
        Write-Host 'Неверный режим. Укажите 1 или 2.' -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}
