# TogglePageFileOnOff.ps1

# 1. Check for administrative privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Warning "This script must be run as an Administrator!"
    Write-Host "Please close this window, right-click PowerShell, and select 'Run as administrator'." -ForegroundColor Yellow
    Pause
    Exit
}

# 2. Get current system configuration
$ComputerSystem = Get-CimInstance -ClassName Win32_ComputerSystem
$isAutoManaged = $ComputerSystem.AutomaticManagedPagefile

Write-Host "Current Status: " -NoNewline
if ($isAutoManaged) {
    Write-Host "Automatically Managed by Windows" -ForegroundColor Green
    Write-Host "Action: DISABLING all pagefiles completely..." -ForegroundColor Red
    
    # Step A: Turn off automatic management
    Set-CimInstance -CimInstance $ComputerSystem -Property @{AutomaticManagedPagefile = $False}
    
    # Step B: Remove any existing pagefile settings instances to completely strip them out
    $PageFileSettings = Get-CimInstance -ClassName Win32_PageFileSetting
    if ($PageFileSettings) {
        $PageFileSettings | Remove-CimInstance
    }
    
} else {
    Write-Host "Custom/Disabled Configuration" -ForegroundColor Yellow
    Write-Host "Action: Enabling AUTOMATIC management..." -ForegroundColor Green
    
    # Re-enabling automatic management tells Windows to recreate and manage pagefile.sys on boot
    Set-CimInstance -CimInstance $ComputerSystem -Property @{AutomaticManagedPagefile = $True}
}

Write-Host "`nConfiguration updated successfully!" -ForegroundColor Green
Write-Host "--------------------------------------------------"

# 3. Prompt user for a restart
$Choice = Read-Host "A restart is required to apply these changes. Restart now? (Y/N)"

if ($Choice -match "^[Yy]$") {
    Write-Host "Restarting computer in 5 seconds... Save your work!" -ForegroundColor Red
    Start-Sleep -Seconds 5
    Restart-Computer -Force
} else {
    Write-Host "Restart canceled. The changes will not take effect until the next reboot." -ForegroundColor Yellow
}