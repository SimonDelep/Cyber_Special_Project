function Wait-AppHealthy {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [int]$TimeoutSeconds = 180,
        [int]$IntervalSeconds = 3
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 5
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                Write-Host "App healthy at $Url (HTTP $($resp.StatusCode))"
                return $true
            }
        }
        catch {
            # not ready
        }
        Start-Sleep -Seconds $IntervalSeconds
        Write-Host "Waiting for $Url..."
    }
    throw "App at $Url did not become healthy within $TimeoutSeconds seconds."
}

