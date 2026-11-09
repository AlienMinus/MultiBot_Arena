# PowerShell Script to Create a Desktop Shortcut for Multi-Bot Arena with Custom Icon
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Multi-Bot Arena.lnk"
$TargetPath = Join-Path $PSScriptRoot "start-arena.bat"
$IconPath = Join-Path $PSScriptRoot "arena.ico"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.IconLocation = "$IconPath, 0"
$Shortcut.Description = "Multi-Bot Arena: Claude, DeepSeek, Gemini, ChatGPT, Grok, and Perplexity in a unified Scarlet Liquid Glass workspace"
$Shortcut.WindowStyle = 1
$Shortcut.Save()

Write-Host "Created shortcut with custom Arena icon at: $ShortcutPath" -ForegroundColor Green
