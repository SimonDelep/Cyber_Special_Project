function Get-ZapDockerUrl {
    param([string]$Url)
    return $Url -replace "localhost", "host.docker.internal"
}

function Get-ZapHostName {
    param([string]$Url)
    try { return ([uri]$Url).Host } catch { return "localhost" }
}

function Get-ZapHostHeaderValue {
    param([string]$Url)
    try {
        $uri = [uri]$Url
        if ($uri.IsDefaultPort) { return $uri.Host }
        return "{0}:{1}" -f $uri.Host, $uri.Port
    }
    catch { return "localhost" }
}

function Test-ZapHostHeaderFix {
    param([string]$Stack)
    return $Stack -in @("astro", "nextjs", "fastapi")
}

function Get-ZapHostReplacerJobYaml {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostHeaderValue
    )

    @"
  - type: replacer
    parameters:
      deleteAllRules: false
    rules:
      - description: Host header override for dev server
        url: ""
        matchType: req_header
        matchString: Host
        replacementString: $HostHeaderValue
        matchRegex: false
"@.TrimEnd()
}

function Get-ZapJsonLoginJobYaml {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LoginUrl,
        [Parameter(Mandatory = $true)]
        [string]$HostHeaderValue,
        [Parameter(Mandatory = $true)]
        [string]$LoginBodyJson
    )

    # Single-quoted YAML data field — escape embedded single quotes only
    $bodyForYaml = $LoginBodyJson.Replace("'", "''")

    @"
  - type: requestor
    requests:
      - url: "$LoginUrl"
        method: POST
        headers:
          - "Content-Type: application/json"
          - "Host: $HostHeaderValue"
        data: '$bodyForYaml'
"@.TrimEnd()
}

function Get-ZapCookieReplacerJobYaml {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CookieHeader
    )

    @"
  - type: replacer
    parameters:
      deleteAllRules: false
    rules:
      - description: Inject authenticated session cookie
        url: ""
        matchType: req_header
        matchString: Cookie
        replacementString: $CookieHeader
        matchRegex: false
"@.TrimEnd()
}

function Get-ZapBearerReplacerJobYaml {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BearerToken
    )

    @"
  - type: replacer
    parameters:
      deleteAllRules: false
    rules:
      - description: Inject authenticated bearer token
        url: ""
        matchType: req_header
        matchString: Authorization
        replacementString: Bearer $BearerToken
        matchRegex: false
"@.TrimEnd()
}

function Get-ZapLoginBodyJson {
    param(
        [Parameter(Mandatory = $true)]
        $App
    )

    $admin = $App.auth.admin
    $body = @{}
    if ($admin.username) { $body.username = $admin.username }
    if ($admin.email) { $body.email = $admin.email }
    $body.password = $admin.password
    return ($body | ConvertTo-Json -Compress)
}

function Expand-ZapScanYaml {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TemplatePath,
        [Parameter(Mandatory = $true)]
        [hashtable]$Replacements,
        [Parameter(Mandatory = $true)]
        [string]$OutPath
    )

    $content = [System.IO.File]::ReadAllText($TemplatePath)
    foreach ($key in $Replacements.Keys) {
        $placeholder = "{{$key}}"
        $content = $content.Replace($placeholder, [string]$Replacements[$key])
    }
    [System.IO.File]::WriteAllText($OutPath, $content)
}

function Invoke-ZapAutomationScan {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ZapDir,
        [Parameter(Mandatory = $true)]
        [string]$PlanFileName,
        [Parameter(Mandatory = $true)]
        [string]$LogFileName
    )

    $logPath = Join-Path $ZapDir $LogFileName
    docker run --rm `
        --add-host=host.docker.internal:host-gateway `
        -v "${ZapDir}:/zap/wrk:rw" `
        ghcr.io/zaproxy/zaproxy:stable `
        zap.sh -cmd -autorun "/zap/wrk/$PlanFileName" `
        2>&1 | Tee-Object -FilePath $logPath
}

function Convert-ZapReportToAlertSummary {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RawJsonPath
    )

    $alerts = @()
    if (-not (Test-Path $RawJsonPath)) {
        return $alerts
    }

    $raw = Get-Content $RawJsonPath -Raw | ConvertFrom-Json
    if ($raw.site) {
        foreach ($site in $raw.site) {
            foreach ($alert in $site.alerts) {
                $alerts += [PSCustomObject]@{
                    name = $alert.alert
                    risk = $alert.riskcode
                    riskDesc = $alert.riskdesc
                    count = $alert.count
                    cweid = $alert.cweid
                    wascid = if ($alert.PSObject.Properties.Name -contains "wascid") { $alert.wascid } else { "" }
                }
            }
        }
    }
    return $alerts
}

function Write-ZapAlertSummary {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        [Parameter(Mandatory = $true)]
        [string]$ScanType,
        [Parameter(Mandatory = $true)]
        [string]$TargetUrl,
        [Parameter(Mandatory = $true)]
        [string]$OutPath,
        [array]$Alerts,
        [hashtable]$Extra = @{}
    )

    $summary = @{
        app = $App.name
        scanType = $ScanType
        scannedAt = (Get-Date).ToString("o")
        targetUrl = $TargetUrl
        alertCount = $Alerts.Count
        high = ($Alerts | Where-Object { $_.risk -eq "3" }).Count
        medium = ($Alerts | Where-Object { $_.risk -eq "2" }).Count
        low = ($Alerts | Where-Object { $_.risk -eq "1" }).Count
        informational = ($Alerts | Where-Object { $_.risk -eq "0" }).Count
        alerts = $Alerts
    }
    foreach ($key in $Extra.Keys) {
        $summary[$key] = $Extra[$key]
    }

    $summary | ConvertTo-Json -Depth 6 | Set-Content $OutPath -Encoding UTF8
    return $summary
}
