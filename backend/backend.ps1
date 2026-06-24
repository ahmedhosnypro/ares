# backend.ps1 — backend manager (PowerShell parity with backend.sh)

[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CliArgs
)

$ErrorActionPreference = 'Stop'

$BackendDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend'
$InfraProj = Join-Path $BackendDir 'Infrastructure/Infrastructure.csproj'
$ApiProj = Join-Path $BackendDir 'Api/Api.csproj'
$Solution = Join-Path $BackendDir 'Ares.slnx'
$EnvFile = Join-Path $BackendDir '.env'
$EfArgs = @('--project', $InfraProj, '--startup-project', $ApiProj)

function Load-Env {
    if (-not (Test-Path $EnvFile)) {
        Write-Host "No .env found at $EnvFile"
        $yn = Read-Host 'Create one from .env.example now? [Y/n]'
        if ($yn -ne 'n' -and $yn -ne 'N') {
            Copy-Item (Join-Path $BackendDir '.env.example') $EnvFile
            Write-Host "Created $EnvFile - edit it with your values, then re-run."
            exit 0
        }
        Write-Host 'Continuing without .env (using appsettings.json values).'
        return
    }

    foreach ($line in Get-Content -Path $EnvFile) {
        if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { continue }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { continue }
        $key = $line.Substring(0, $idx)
        $val = $line.Substring($idx + 1).Trim('"').Trim("'")
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

function Is-InteractiveTerminal {
    return (-not [Console]::IsInputRedirected) -and (-not [Console]::IsOutputRedirected)
}

function Show-Header {
    Write-Host ''
    Write-Host '  ╔══════════════════════════════════╗'
    Write-Host '  ║     Ares Backend Manager         ║'
    Write-Host '  ╚══════════════════════════════════╝'
    Write-Host ''
}

function Invoke-LabelledCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    Write-Host "▶ $Label"
    Write-Host '──────────────────────────────────────'

    $stdoutFile = [System.IO.Path]::GetTempFileName()
    $stderrFile = [System.IO.Path]::GetTempFileName()
    $proc = Start-Process -FilePath $FilePath -ArgumentList $Arguments -NoNewWindow -PassThru -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile

    $printedOutLength = 0
    $printedErrLength = 0
    $lastOutputAt = Get-Date

    while (-not $proc.HasExited) {
        $stdout = ''
        $stderr = ''

        if (Test-Path $stdoutFile) {
            $stdout = Get-Content -Path $stdoutFile -Raw -ErrorAction SilentlyContinue
            if ($null -eq $stdout) { $stdout = '' }
        }

        if (Test-Path $stderrFile) {
            $stderr = Get-Content -Path $stderrFile -Raw -ErrorAction SilentlyContinue
            if ($null -eq $stderr) { $stderr = '' }
        }

        $hadNewOutput = $false

        if ($stdout.Length -gt $printedOutLength) {
            [Console]::Write($stdout.Substring($printedOutLength))
            $printedOutLength = $stdout.Length
            $hadNewOutput = $true
        }

        if ($stderr.Length -gt $printedErrLength) {
            [Console]::Write($stderr.Substring($printedErrLength))
            $printedErrLength = $stderr.Length
            $hadNewOutput = $true
        }

        if ($hadNewOutput) {
            $lastOutputAt = Get-Date
        } elseif (((Get-Date) - $lastOutputAt).TotalSeconds -ge 3) {
            Write-Host "… still working ($Label)"
            $lastOutputAt = Get-Date
        }

        Start-Sleep -Milliseconds 200
    }

    # Flush trailing output.
    $finalStdout = ''
    $finalStderr = ''
    if (Test-Path $stdoutFile) {
        $finalStdout = Get-Content -Path $stdoutFile -Raw -ErrorAction SilentlyContinue
        if ($null -eq $finalStdout) { $finalStdout = '' }
    }
    if (Test-Path $stderrFile) {
        $finalStderr = Get-Content -Path $stderrFile -Raw -ErrorAction SilentlyContinue
        if ($null -eq $finalStderr) { $finalStderr = '' }
    }

    if ($finalStdout.Length -gt $printedOutLength) {
        [Console]::Write($finalStdout.Substring($printedOutLength))
    }
    if ($finalStderr.Length -gt $printedErrLength) {
        [Console]::Write($finalStderr.Substring($printedErrLength))
    }

    Remove-Item -Path $stdoutFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $stderrFile -Force -ErrorAction SilentlyContinue

    Write-Host '──────────────────────────────────────'
    if ($proc.ExitCode -eq 0) {
        Write-Host '✔ Done'
    } else {
        Write-Host "✗ Failed (exit code: $($proc.ExitCode))"
        return $proc.ExitCode
    }

    return 0
}

function Ensure-DbHostResolves {
    $conn = [System.Environment]::GetEnvironmentVariable('ConnectionStrings__DefaultConnection', 'Process')
    if ([string]::IsNullOrWhiteSpace($conn)) { return $true }

    $match = [regex]::Match($conn, 'Server=([^,;]+)')
    if (-not $match.Success) { return $true }

    $hostName = $match.Groups[1].Value
    # If using a named instance (e.g., Host\Instance), extract just the Host part
    $dnsHostName = $hostName -replace '\\.*$', ''
    
    if ($dnsHostName -in @('localhost', '127.0.0.1', '.', '(localdb)')) { return $true }

    try {
        [System.Net.Dns]::GetHostAddresses($dnsHostName) | Out-Null
        return $true
    } catch {
        Write-Host "Database host '$hostName' is not resolvable from this environment."
        Write-Host "Update $EnvFile and set ConnectionStrings__DefaultConnection accordingly:"
        Write-Host '  - Use Server=mssql,1433 inside the devcontainer'
        Write-Host '  - Use Server=localhost,1433 outside the devcontainer'
        return $false
    }
}

function Show-Usage {
    @"
Usage:
  scripts/backend.ps1 [command] [options]

Commands:
  menu
      Open interactive menu (number/letter selection).

  build
      Build the backend solution.

  run
      Run the API project.

  migrate add --name <MigrationName>
  migrate update [--target <MigrationName|0|latest>]
  migrate list
  migrate remove

  seed

  db drop [--yes]

  help

Examples:
  scripts/backend.ps1 build
  scripts/backend.ps1 migrate add --name AddBookingIndexes
  scripts/backend.ps1 migrate update --target latest
  scripts/backend.ps1 seed
  scripts/backend.ps1 db drop --yes
  scripts/backend.ps1 menu
"@
}

function Select-PlainMenu {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string[]]$Options
    )

    if (-not (Is-InteractiveTerminal)) {
        Write-Host 'Interactive selection requires a terminal (TTY).'
        return $null
    }

    Write-Host $Title
    for ($i = 0; $i -lt $Options.Count; $i++) {
        if ($i -lt 26) {
            $letter = [char](97 + $i)
            Write-Host ("  {0,2}) [{1}] {2}" -f ($i + 1), $letter, $Options[$i])
        } else {
            Write-Host ("  {0,2}) {1}" -f ($i + 1), $Options[$i])
        }
    }

    if ($Options.Count -le 26) {
        $lastLetter = [char](96 + $Options.Count)
        Write-Host "Choose by number (1-$($Options.Count)) or letter (a-$lastLetter)."
    } else {
        Write-Host "Choose by number (1-$($Options.Count))."
    }

    while ($true) {
        $inputValue = Read-Host 'Choice'
        $normalized = $inputValue.ToLowerInvariant()

        $num = 0
        if ([int]::TryParse($normalized, [ref]$num)) {
            if ($num -ge 1 -and $num -le $Options.Count) {
                return $Options[$num - 1]
            }
        }

        if ($normalized -match '^[a-z]$' -and $Options.Count -le 26) {
            $idx = [int][char]$normalized - [int][char]'a'
            if ($idx -ge 0 -and $idx -lt $Options.Count) {
                return $Options[$idx]
            }
        }

        Write-Host 'Invalid choice. Try again.'
    }
}

function Sign-Assemblies {
    Write-Host '▶ Unblocking and signing compiled assemblies to bypass Application Control policy'
    
    $projectNames = @('Domain', 'Application', 'Infrastructure', 'Api', 'Tests')
    
    # Run the unblocking and signing in an external PowerShell process
    # to prevent PowerShell from leaking file locks in the user's active session.
    $signBlock = {
        param($BackendDir, $projectNames)
        $cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Subject -eq "CN=DevCert" } | Select-Object -First 1
        if ($null -eq $cert) {
            $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=DevCert" -CertStoreLocation "Cert:\CurrentUser\My" -ErrorAction SilentlyContinue
        }
        if ($cert) {
            Get-ChildItem -Path $BackendDir -Recurse | Where-Object { $_.Extension -in @('.dll', '.exe') } | ForEach-Object {
                if ($_.FullName -like "*\bin\Debug\net10.0\*") {
                    if ($_.BaseName -in $projectNames) {
                        $filePath = $_.FullName
                        for ($retry = 1; $retry -le 5; $retry++) {
                            try {
                                Unblock-File -Path $filePath -ErrorAction SilentlyContinue
                                Set-AuthenticodeSignature -FilePath $filePath -Certificate $cert -ErrorAction Stop | Out-Null
                                break
                            } catch {
                                Start-Sleep -Milliseconds 200
                            }
                        }
                    }
                }
            }
        }
    }
    
    & powershell.exe -NoProfile -NonInteractive -Command $signBlock -args $BackendDir, $projectNames
    Write-Host '✔ Finished signing compiled assemblies.'
}

function Action-Build {
    [void](Invoke-LabelledCommand -Label 'Building solution' -FilePath 'dotnet' -Arguments @('build', $Solution))
    if ($env:ARES_SIGN_ASSEMBLIES -eq 'true') {
        Sign-Assemblies
    }
}

function Action-Run {
    Action-Build
    Write-Host '▶ Running API (Ctrl+C to stop)'
    Write-Host '──────────────────────────────────────'
    dotnet run --project $ApiProj --no-build
}

function Action-MigrateAdd {
    param([string]$Name)

    if (-not (Ensure-DbHostResolves)) { return }

    if ([string]::IsNullOrWhiteSpace($Name)) {
        if (-not (Is-InteractiveTerminal)) {
            Write-Host 'Migration name is required in non-interactive mode. Use: migrate add --name <MigrationName>'
            return
        }
        $Name = Read-Host 'Migration name'
    }

    if ([string]::IsNullOrWhiteSpace($Name)) {
        Write-Host 'Aborted - no name provided.'
        return
    }

    $args = @('ef', 'migrations', 'add', $Name) + $EfArgs
    [void](Invoke-LabelledCommand -Label "Adding migration: $Name" -FilePath 'dotnet' -Arguments $args)
}

function Action-MigrateUpdate {
    param([string]$SelectedTarget)

    if (-not (Ensure-DbHostResolves)) { return }

    $migrationsRaw = (& dotnet ef migrations list @EfArgs --no-connect 2>$null)
    $migrations = @($migrationsRaw | Where-Object { $_ -match '^[0-9]{14}_[A-Za-z0-9_]+$' })
    $targetOptions = @('latest (HEAD)', '0 (rollback all)') + $migrations

    $target = $null
    if (-not [string]::IsNullOrWhiteSpace($SelectedTarget)) {
        switch ($SelectedTarget.ToLowerInvariant()) {
            'latest' { $target = 'latest (HEAD)' }
            'head' { $target = 'latest (HEAD)' }
            'rollback' { $target = '0 (rollback all)' }
            'zero' { $target = '0 (rollback all)' }
            '0' { $target = '0 (rollback all)' }
            default { $target = $SelectedTarget }
        }
    } elseif (Is-InteractiveTerminal) {
        $target = Select-PlainMenu -Title 'Migration targets:' -Options $targetOptions
    } else {
        $target = 'latest (HEAD)'
    }

    if ([string]::IsNullOrWhiteSpace($target)) {
        Write-Host 'Aborted.'
        return
    }

    if ($target -eq 'latest (HEAD)') {
        $args = @('ef', 'database', 'update') + $EfArgs
        [void](Invoke-LabelledCommand -Label 'Updating database to latest' -FilePath 'dotnet' -Arguments $args)
    } else {
        $migName = ($target -split '\s+')[0]
        $args = @('ef', 'database', 'update', $migName) + $EfArgs
        [void](Invoke-LabelledCommand -Label "Updating database to: $migName" -FilePath 'dotnet' -Arguments $args)
    }
}

function Action-MigrateList {
    if (-not (Ensure-DbHostResolves)) { return }
    $args = @('ef', 'migrations', 'list') + $EfArgs + @('--no-connect')
    [void](Invoke-LabelledCommand -Label 'Listing migrations' -FilePath 'dotnet' -Arguments $args)
}

function Action-MigrateRemove {
    $args = @('ef', 'migrations', 'remove') + $EfArgs
    [void](Invoke-LabelledCommand -Label 'Removing last migration' -FilePath 'dotnet' -Arguments $args)
}

function Action-Seed {
    if (-not (Ensure-DbHostResolves)) { return }

    $args = @('ef', 'database', 'update') + $EfArgs
    [void](Invoke-LabelledCommand -Label 'Updating database to latest' -FilePath 'dotnet' -Arguments $args)

    Action-Build

    [System.Environment]::SetEnvironmentVariable('SEED_DEMO_DATA', 'true', 'Process')
    $args = @('run', '--project', $ApiProj, '--no-build', '--no-launch-profile', '--', '--seed-only')
    [void](Invoke-LabelledCommand -Label 'Seeding database' -FilePath 'dotnet' -Arguments $args)
}

function Action-DbDrop {
    param([bool]$Force)

    if (-not (Ensure-DbHostResolves)) { return }

    if (-not $Force) {
        if (-not (Is-InteractiveTerminal)) {
            Write-Host 'Refusing to drop database in non-interactive mode without --yes.'
            return
        }

        $confirm = Select-PlainMenu -Title 'Confirm database drop (destructive):' -Options @('yes - Drop the database', 'no  - Cancel')
        if ($null -eq $confirm -or -not $confirm.StartsWith('yes')) {
            Write-Host 'Aborted.'
            return
        }
    }

    $args = @('ef', 'database', 'drop', '--force') + $EfArgs
    [void](Invoke-LabelledCommand -Label 'Dropping database' -FilePath 'dotnet' -Arguments $args)
}

$Menu = @(
    'build          - Build the solution',
    'run            - Run the API',
    'migrate add    - Add a new migration',
    'migrate update - Apply migrations to the database',
    'migrate list   - List all migrations',
    'migrate remove - Remove the last migration',
    'seed           - Seed dev/demo data',
    'db drop        - Drop the database',
    'quit           - Exit'
)

function Parse-OptionValue {
    param(
        [string[]]$ArgList,
        [string[]]$Names
    )

    for ($i = 0; $i -lt $ArgList.Count; $i++) {
        if ($Names -contains $ArgList[$i]) {
            if ($i + 1 -ge $ArgList.Count) {
                throw "Missing value for option $($ArgList[$i])"
            }
            return $ArgList[$i + 1]
        }
    }

    return ''
}

function Main {
    Load-Env

    $command = if ($CliArgs.Count -gt 0) { $CliArgs[0] } else { 'menu' }

    switch ($command) {
        { $_ -in @('help', '-h', '--help') } {
            Show-Usage
            break
        }

        'menu' {
            Show-Header

            if (-not (Is-InteractiveTerminal)) {
                Write-Host 'Menu mode requires an interactive terminal.'
                Write-Host 'Use command mode instead (e.g. scripts/backend.ps1 build).'
                exit 1
            }

            while ($true) {
                $choice = Select-PlainMenu -Title 'Actions:' -Options $Menu
                if ([string]::IsNullOrWhiteSpace($choice) -or $choice -like 'quit*') {
                    Write-Host 'Bye.'
                    return
                }

                switch -Wildcard ($choice) {
                    'build*' { Action-Build }
                    'run*' { Action-Run }
                    'migrate add*' { Action-MigrateAdd -Name '' }
                    'migrate update*' { Action-MigrateUpdate -SelectedTarget '' }
                    'migrate list*' { Action-MigrateList }
                    'migrate remove*' { Action-MigrateRemove }
                    seed*            { Action-Seed }
                    'db drop*' { Action-DbDrop -Force:$false }
                }

                Write-Host ''
                Read-Host 'Press Enter to return to menu' | Out-Null
            }
            break
        }

        'build' {
            Action-Build
            break
        }

        'run' {
            Action-Run
            break
        }

        'migrate' {
            $subcommand = if ($CliArgs.Count -gt 1) { $CliArgs[1] } else { '' }
            $rest = if ($CliArgs.Count -gt 2) { $CliArgs[2..($CliArgs.Count - 1)] } else { @() }

            switch ($subcommand) {
                'add' {
                    foreach ($arg in $rest) {
                        if ($arg -notin @('--name', '-n') -and $rest.IndexOf($arg) -gt 0 -and $rest[$rest.IndexOf($arg) - 1] -in @('--name', '-n')) { continue }
                    }
                    $name = Parse-OptionValue -ArgList $rest -Names @('--name', '-n')
                    if ($rest.Count -gt 0 -and [string]::IsNullOrWhiteSpace($name)) {
                        Write-Host 'Unknown or invalid option for migrate add. Use --name <MigrationName>.'
                        Show-Usage
                        exit 1
                    }
                    Action-MigrateAdd -Name $name
                    break
                }
                'update' {
                    $target = ''
                    if ($rest -contains '--latest') { $target = 'latest' }
                    $explicitTarget = Parse-OptionValue -ArgList $rest -Names @('--target', '-t')
                    if (-not [string]::IsNullOrWhiteSpace($explicitTarget)) { $target = $explicitTarget }

                    foreach ($arg in $rest) {
                        if ($arg -in @('--target', '-t', '--latest')) { continue }
                        if ($explicitTarget -ne '' -and $arg -eq $explicitTarget) { continue }
                        Write-Host "Unknown option for migrate update: $arg"
                        Show-Usage
                        exit 1
                    }

                    Action-MigrateUpdate -SelectedTarget $target
                    break
                }
                'list' {
                    Action-MigrateList
                    break
                }
                'remove' {
                    Action-MigrateRemove
                    break
                }
                default {
                    Write-Host "Unknown migrate subcommand: $subcommand"
                    Show-Usage
                    exit 1
                }
            }

            break
        }

        'seed' {
            Action-Seed
            break
        }

        'db' {
            $subcommand = if ($CliArgs.Count -gt 1) { $CliArgs[1] } else { '' }
            $rest = if ($CliArgs.Count -gt 2) { $CliArgs[2..($CliArgs.Count - 1)] } else { @() }

            switch ($subcommand) {
                'drop' {
                    foreach ($arg in $rest) {
                        if ($arg -ne '--yes' -and $arg -ne '-y') {
                            Write-Host "Unknown option for db drop: $arg"
                            Show-Usage
                            exit 1
                        }
                    }
                    Action-DbDrop -Force:($rest -contains '--yes' -or $rest -contains '-y')
                    break
                }
                default {
                    Write-Host "Unknown db subcommand: $subcommand"
                    Show-Usage
                    exit 1
                }
            }

            break
        }

        default {
            Write-Host "Unknown command: $command"
            Show-Usage
            exit 1
        }
    }
}

Main
