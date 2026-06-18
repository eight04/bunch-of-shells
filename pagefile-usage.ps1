while ($true) {
    # Get Current Usage in Megabytes and Peak Usage
    $pagefile = Get-CimInstance Win32_PageFileUsage | Select-Object AllocatedBaseSize, CurrentUsage
    $allocated = $pagefile.AllocatedBaseSize
    $current = $pagefile.CurrentUsage

    # Avoid division by zero
    if ($allocated -gt 0) {
        $percentage = [math]::Round(($current / $allocated) * 100)
    } else {
        $percentage = 0
    }

    # Create a visual bar (20 blocks total)
    $barCount = [math]::Floor($percentage / 5)
    $visualBar = ("#" * $barCount) + (" " * (20 - $barCount))

    # Output to terminal
    Write-Host ("Pagefile: {0,3}% |[{1}]| {2} MB / {3} MB" -f $percentage, $visualBar, $current, $allocated) -NoNewline -BackgroundColor Black -ForegroundColor Cyan
    Start-Sleep -Milliseconds 500
    Write-Host `r -NoNewline
}