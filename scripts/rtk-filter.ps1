#Requires -Version 5.1
<#
.SYNOPSIS
  RTK-style shell output filter for Windows. Cuts noise, keeps substance.
  复用 github.com/rtk-ai/rtk 策略：智能过滤 + 分组 + 截断 + 去重。

.DESCRIPTION
  Wraps any shell command and compresses output before it hits LLM context.
  Supports: ls/tree, cat/read, grep/rg, git, test runners, build logs.

.PARAMETER Command
  Command to run (e.g., "git", "cat", "npm")

.PARAMETER Args
  Arguments to pass to the command

.EXAMPLE
  .\rtk-filter.ps1 git status
  .\rtk-filter.ps1 npm test
  .\rtk-filter.ps1 cat src/app/page.tsx
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

# --- Detect command category ---
$category = switch -Wildcard ($Command.ToLower()) {
    "git"        { "git" }
    "npm"        { "npm" }
    "pnpm"       { "npm" }
    "yarn"       { "npm" }
    "node"       { "node" }
    "npx"        { "node" }
    "cargo"      { "cargo" }
    "pytest"     { "pytest" }
    "python"     { "python" }
    "tsc"        { "tsc" }
    "next"       { "next" }
    "docker"     { "docker" }
    "kubectl"    { "kubectl" }
    "ls"         { "ls" }
    "dir"        { "ls" }
    "cat"        { "cat" }
    "type"       { "cat" }
    "findstr"    { "grep" }
    "select-string" { "grep" }
    "rg"         { "grep" }
    default      { "generic" }
}

# --- Run command and capture output ---
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $Command
$psi.Arguments = ($Args | ForEach-Object { '"' + ($_ -replace '"', '""') + '"' }) -join " "
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit()

$lines = $stdout -split "`r?`n" | Where-Object { $_.Trim() -ne "" }

# --- Category-specific filters (RTK strategies) ---
switch ($category) {
    "git" {
        # Collapse verbose git push/pull output
        if ($Args -contains "push" -or $Args -contains "pull") {
            $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
            if ($stderr -match "error|fatal|rejected") {
                Write-Output "FAIL: $branch`n$stderr"
            } else {
                Write-Output "ok $branch"
            }
            exit 0
        }
        # Compact git status
        if ($Args -contains "status") {
            $modified = @($lines | Where-Object { $_ -match "^\s*M" })
            $untracked = @($lines | Where-Object { $_ -match "^\s*\?\?" })
            $staged = @($lines | Where-Object { $_ -match "^\s*A|^\s*D" })
            $out = @()
            if ($staged.Count)   { $out += "Staged: $($staged.Count)" }
            if ($modified.Count) { $out += "Modified: $($modified.Count)" }
            if ($untracked.Count){ $out += "Untracked: $($untracked.Count)" }
            if ($out.Count -eq 0){ $out += "Clean" }
            Write-Output ($out -join " | ")
            exit 0
        }
        # Compact git log
        if ($Args -contains "log") {
            $lines | ForEach-Object {
                if ($_ -match "^commit\s+(\w{7})") {
                    $hash = $matches[1]
                    $msg = ($_ -replace "^commit\s+\w+\s*", "").Trim()
                    if ($msg) { "$hash $msg" } else { $hash }
                }
            } | Select-Object -First 10
            exit 0
        }
    }

    "npm" {
        # Collapse npm test / build output
        if ($Args -contains "test" -or $Args -contains "run" -and ($Args -contains "test" -or $Args -contains "test:unit")) {
            $failures = @($lines | Where-Object { $_ -match "FAIL|failed|error" })
            $passes = @($lines | Where-Object { $_ -match "PASS|passed|ok\s+\d" })
            if ($failures.Count -gt 0) {
                Write-Output "FAILED: $($failures.Count)"
                $failures | Select-Object -First 5 | Write-Output
            } else {
                $total = if ($passes.Count) { $passes.Count } else { "?" }
                Write-Output "PASS: $total tests"
            }
            exit 0
        }
        # npm install: strip progress bars
        if ($Args -contains "install" -or $Args -contains "i") {
            $added = @($lines | Where-Object { $_ -match "added\s+\d+" })
            $removed = @($lines | Where-Object { $_ -match "removed\s+\d+" })
            $out = @()
            if ($added.Count)    { $out += $added[0] }
            if ($removed.Count)  { $out += $removed[0] }
            if ($out.Count -eq 0){ $out += "Done" }
            Write-Output ($out -join " | ")
            exit 0
        }
    }

    "ls" {
        # Group by directory, show counts
        $files = $lines | Where-Object { $_ -notmatch "^\s*(Mode|LastWriteTime|Name|----)" }
        $dirs = @($files | Where-Object { $_ -match "<DIR>" -or $_ -match "^d" })
        $regular = @($files | Where-Object { $_ -notmatch "<DIR>" -and $_ -notmatch "^d" })
        Write-Output "Dirs: $($dirs.Count) | Files: $($regular.Count)"
        $files | Select-Object -First 20 | Write-Output
        if ($files.Count -gt 20) {
            Write-Output "... ($($files.Count - 20) more)"
        }
        exit 0
    }

    "cat" {
        # Strip excessive blank lines, trailing whitespace
        $clean = $lines | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.TrimEnd() }
        $clean | Write-Output
        exit 0
    }

    "grep" {
        # Group by file, show counts
        $grouped = @{}
        foreach ($line in $lines) {
            if ($line -match "^(.+?):(\d+):") {
                $file = $matches[1]
                if (-not $grouped[$file]) { $grouped[$file] = 0 }
                $grouped[$file]++
            }
        }
        foreach ($file in $grouped.Keys | Sort-Object) {
            Write-Output "$file : $($grouped[$file]) matches"
        }
        exit 0
    }

    "docker" {
        # Compact docker ps
        if ($Args -contains "ps") {
            $containers = @($lines | Where-Object { $_ -match "^[0-9a-f]" })
            Write-Output "Containers: $($containers.Count)"
            $containers | ForEach-Object {
                $parts = $_ -split "\s{2,}"
                if ($parts.Count -ge 2) { "$($parts[0].Substring(0,12)) $($parts[-1])" }
            }
            exit 0
        }
    }
}

# --- Generic fallback: truncate if too long ---
$MAX_LINES = 50
if ($lines.Count -gt $MAX_LINES) {
    $lines | Select-Object -First $MAX_LINES | Write-Output
    Write-Output "... ($($lines.Count - $MAX_LINES) more lines, use -v for full)"
} else {
    $lines | Write-Output
}

# Pass through stderr
if ($stderr) {
    Write-Output "`n[stderr]:`n$stderr"
}

exit $proc.ExitCode
