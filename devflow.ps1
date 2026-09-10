$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"
$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "C:\miniconda\python.exe" "C:\Users\long\.gemini\antigravity\scratch\rigorous-dev-workflow\cli.py" $args --target-dir $CurrentDir
