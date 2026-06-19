#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Continue"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")
. (Join-Path $PSScriptRoot "..\lib\SessionHelper.ps1")
. (Join-Path $PSScriptRoot "..\lib\UploadHelper.ps1")

$app = Get-AppEntry -AppName $AppName
$baseUrl = $app.url
$apiUrl = $app.apiUrl

function AppApiUrl([string]$LegacyPath) {
    return Resolve-AppApiUrl -App $app -LegacyPath $LegacyPath
}

function ProbeUrl([string]$Path) {
    if ($Path -match "^/api/") {
        return AppApiUrl $Path
    }
    return "$baseUrl$Path"
}

$payloads = Get-Content (Join-Path $PSScriptRoot "payloads.json") -Raw | ConvertFrom-Json
$manualDir = Join-Path (Get-ResultsDir -AppName $AppName) "manual"
New-Item -ItemType Directory -Path $manualDir -Force | Out-Null

$endpointsPath = Join-Path $manualDir "endpoints.json"
if (-not (Test-Path $endpointsPath)) {
    & (Join-Path $PSScriptRoot "discover-endpoints.ps1") -AppName $AppName
}
$endpoints = Get-Content $endpointsPath -Raw | ConvertFrom-Json

$results = @()

function Add-TestResult {
    param(
        [string]$Id,
        [string]$Name,
        [string]$Result,
        [string]$Evidence,
        [string]$Covers
    )
    $script:results += [PSCustomObject]@{
        id = $Id
        name = $Name
        result = $Result
        evidence = $Evidence
        covers = $Covers
        testedAt = (Get-Date).ToString("o")
    }
}

function Test-StatusBlocked {
    param($Response)
    if (-not $Response) { return $false }
    $code = if ($Response.StatusCode) { [int]$Response.StatusCode } else { [int]$Response.StatusCode.value__ }
    return ($code -in 401, 403, 404, 302, 303) -or ($code -ge 400)
}

function Get-RequestOutcome {
    param(
        [string]$Url,
        $WebSession = $null,
        [string]$Method = "GET"
    )

    $params = @{
        Uri = $Url
        Method = $Method
        UseBasicParsing = $true
        MaximumRedirection = 0
        ErrorAction = "SilentlyContinue"
        TimeoutSec = 30
    }
    if ($WebSession) { $params.WebSession = $WebSession }

    try {
        $r = Invoke-WebRequest @params
        if (-not $r) {
            return @{ status = 0; location = $null; finalPath = $null }
        }

        $loc = $null
        try { $loc = $r.Headers["Location"] } catch { }
        $path = $null
        try { $path = ([Uri]$r.BaseResponse.ResponseUri).AbsolutePath } catch { }

        return @{
            status = [int]$r.StatusCode
            location = $loc
            finalPath = $path
        }
    }
    catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $loc = $null
            try { $loc = [string]$resp.Headers.Location } catch { }
            return @{
                status = [int]$resp.StatusCode
                location = $loc
                finalPath = $null
            }
        }
        # Network error / connection refused / name resolution: treat as "no response"
        return @{ status = 0; location = $null; finalPath = $null }
    }
}

function Format-RequestOutcome {
    param($Outcome, [string]$Path)
    if ($Outcome.location) { return "$Path -> $($Outcome.status) -> $($Outcome.location)" }
    if ($Outcome.finalPath) { return "$Path -> $($Outcome.status) ($($Outcome.finalPath))" }
    return "$Path -> $($Outcome.status)"
}

function Test-AdminRouteDenied {
    param($Outcome, [string]$RequestedPath)

    # A redirect to a login/sign-in page or any unauthorized/forbidden marker counts as a denial.
    $denyLocation = "/login|/signin|/unauthorized|/forbidden|forbidden|unauthorized|error=forbidden"

    if ($RequestedPath -match "^/api/") {
        if ($Outcome.status -in 301, 302, 303, 307, 308) {
            return ($Outcome.location -match $denyLocation)
        }
        return ($Outcome.status -in 401, 403, 404) -or ($Outcome.status -ge 400)
    }

    if ($Outcome.status -in 301, 302, 303, 307, 308) {
        if ($Outcome.location -match $denyLocation) { return $true }
        return $false
    }

    if ($Outcome.status -eq 200 -and $Outcome.finalPath -match "/admin") { return $false }
    return ($Outcome.status -in 401, 403, 404) -or ($Outcome.status -ge 400)
}

function Test-ProfileRouteDenied {
    param($Outcome)

    if ($Outcome.status -in 301, 302, 303, 307, 308) {
        return ($Outcome.location -match "/login" -or $Outcome.location -match "/signin")
    }

    if ($Outcome.status -eq 200 -and $Outcome.finalPath -match "^/profile") { return $false }
    return ($Outcome.status -in 401, 403, 404) -or ($Outcome.status -ge 400)
}

function Try-Urls {
    param([string[]]$Paths, $WebSession = $null, [string]$Method = "GET", $Body = $null)
    foreach ($p in $Paths) {
        $url = if ($p.StartsWith("http")) { $p } else { "$baseUrl$p" }
        $r = Invoke-AppRequest -Url $url -Method $Method -WebSession $WebSession -Body $Body
        if ($r) { return @{ url = $url; response = $r } }
    }
    return $null
}

function Feature-Na {
    param([string]$Feature)
    return -not $app.features.$Feature
}

# M1: Admin without login
if (Feature-Na "auth") {
    Add-TestResult "M1" "Admin without login" "N/A" "No auth feature" "A01"
}
else {
    $paths = @("/admin", "/admin/users", "/api/admin/users") + [string[]]$endpoints.defaults.admin
    $blocked = $true
    $evidence = @()
    foreach ($p in ($paths | Select-Object -Unique)) {
        $outcome = Get-RequestOutcome -Url (ProbeUrl $p)
        $evidence += (Format-RequestOutcome -Outcome $outcome -Path $p)
        if (-not (Test-AdminRouteDenied -Outcome $outcome -RequestedPath $p)) { $blocked = $false }
    }
    Add-TestResult "M1" "Admin without login" $(if ($blocked) { "Pass" } else { "Fail" }) ($evidence -join "; ") "A01"
}

# M2: Admin as customer
if (Feature-Na "auth") {
    Add-TestResult "M2" "Admin as customer" "N/A" "No auth feature" "A01"
}
else {
    try {
        $custSession = New-AppSession -App $app -Role "customer"
        $paths = @("/admin", "/api/admin/users")
        $denied = $true
        $evidence = @()
        foreach ($p in $paths) {
            $outcome = Get-RequestOutcome -Url (ProbeUrl $p) -WebSession $custSession
            $evidence += (Format-RequestOutcome -Outcome $outcome -Path $p)
            if (-not (Test-AdminRouteDenied -Outcome $outcome -RequestedPath $p)) { $denied = $false }
        }
        Add-TestResult "M2" "Admin as customer" $(if ($denied) { "Pass" } else { "Fail" }) ($evidence -join "; ") "A01"
    }
    catch {
        Add-TestResult "M2" "Admin as customer" "Fail" "Login failed: $_" "A01"
    }
}

# M3: IDOR
if (Feature-Na "auth") {
    Add-TestResult "M3" "IDOR on profile/order" "N/A" "No auth feature" "A01"
}
else {
    try {
        $session = New-AppSession -App $app -Role "customer"
        $idorPaths = @("/api/orders/1", "/api/orders/2", "/api/profile/2", "/api/users/2")
        $blocked = $true
        $ev = @()
        foreach ($p in $idorPaths) {
            $r = Invoke-AppRequest -Url (AppApiUrl $p) -WebSession $session
            $code = if ($r.StatusCode) { $r.StatusCode } else { "err" }
            $ev += "$p->$code"
            if ($r.StatusCode -eq 200) { $blocked = $false }
        }
        Add-TestResult "M3" "IDOR on profile/order" $(if ($blocked) { "Pass" } else { "Fail" }) ($ev -join "; ") "A01"
    }
    catch {
        Add-TestResult "M3" "IDOR on profile/order" "N/A" "Could not test: $_" "A01"
    }
}

# M4: Session after logout
if (Feature-Na "auth") {
    Add-TestResult "M4" "Session after logout" "N/A" "No auth feature" "A07"
}
else {
    try {
        $session = New-AppSession -App $app -Role "customer"
        if ($app.auth.loginMethod -eq "nextauth") {
            # NextAuth signout: CSRF-protected POST to /api/auth/signout clears the session cookie.
            try {
                $csrf = (Invoke-RestMethod -Uri "$apiUrl/api/auth/csrf" -WebSession $session -TimeoutSec 30).csrfToken
                Invoke-WebRequest -Uri "$apiUrl/api/auth/signout" -Method POST `
                    -Body @{ csrfToken = $csrf; json = "true"; callbackUrl = "$baseUrl/" } `
                    -WebSession $session -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction SilentlyContinue | Out-Null
            }
            catch { }
        }
        else {
            Invoke-AppRequest -Url (AppApiUrl "/api/auth/logout") -Method POST -WebSession $session | Out-Null
        }
        $outcome = Get-RequestOutcome -Url "$baseUrl/profile" -WebSession $session
        $pass = Test-ProfileRouteDenied -Outcome $outcome
        $evidence = "profile after logout: " + (Format-RequestOutcome -Outcome $outcome -Path "/profile")
        Add-TestResult "M4" "Session after logout" $(if ($pass) { "Pass" } else { "Fail" }) $evidence "A07"
    }
    catch {
        Add-TestResult "M4" "Session after logout" "N/A" "Could not test: $_" "A07"
    }
}

# M5: Generic login errors
if (Feature-Na "auth") {
    Add-TestResult "M5" "Generic login errors" "N/A" "No auth feature" "A07"
}
else {
    try {
        if ($app.auth.loginMethod -eq "nextauth") {
            function Invoke-NextAuthFailedLogin {
                param([hashtable]$Fields)
                $attemptSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                $csrf = (Invoke-RestMethod -Uri "$apiUrl/api/auth/csrf" -WebSession $attemptSession -TimeoutSec 30).csrfToken
                $form = @{
                    csrfToken = $csrf
                    password = $Fields.password
                    callbackUrl = "$baseUrl/"
                    json = "true"
                }
                if ($Fields.username) { $form.username = $Fields.username }
                if ($Fields.email) { $form.email = $Fields.email }
                $status = 0
                try {
                    $resp = Invoke-WebRequest -Uri "$apiUrl/api/auth/callback/credentials" -Method POST `
                        -Body $form -WebSession $attemptSession -UseBasicParsing `
                        -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction Stop
                    $status = [int]$resp.StatusCode
                }
                catch {
                    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
                    elseif ($_.FullyQualifiedErrorId -eq 'MaximumRedirectExceeded,Microsoft.PowerShell.Commands.InvokeWebRequestCommand') { $status = 302 }
                }
                $sessionResp = Invoke-WebRequest -Uri "$apiUrl/api/auth/session" -WebSession $attemptSession -UseBasicParsing -TimeoutSec 30
                $hasUser = $null -ne (($sessionResp.Content | ConvertFrom-Json).user)
                return @{ status = $status; sessionEstablished = $hasUser }
            }

            if ($app.auth.admin.email) {
                $attempt1 = Invoke-NextAuthFailedLogin @{ email = "nonexistent@example.com"; password = "wrong" }
                $attempt2 = Invoke-NextAuthFailedLogin @{ email = $app.auth.admin.email; password = "wrongpassword_xyz" }
            }
            else {
                $attempt1 = Invoke-NextAuthFailedLogin @{ username = "nonexistent_user_xyz"; password = "wrong" }
                $attempt2 = Invoke-NextAuthFailedLogin @{ username = $app.auth.admin.username; password = "wrongpassword_xyz" }
            }
            $c1 = $attempt1.status
            $c2 = $attempt2.status
            $pass = ($c1 -eq $c2) -and (-not $attempt1.sessionEstablished) -and (-not $attempt2.sessionEstablished)
            $evidence = "status $c1 vs $c2; sessions denied"
        }
        elseif ($app.auth.loginMethod -eq "form") {
            $loginUrl = "$apiUrl$($app.auth.loginPath)"
            function Invoke-FormFailedLogin {
                param([hashtable]$Fields)
                $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                $status = 0; $loc = ""
                try {
                    $resp = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $Fields `
                        -ContentType "application/x-www-form-urlencoded" -WebSession $s `
                        -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction Stop
                    $status = [int]$resp.StatusCode
                }
                catch {
                    if ($_.Exception.Response) {
                        $status = [int]$_.Exception.Response.StatusCode
                        $loc = [string]$_.Exception.Response.Headers.Location
                    }
                    elseif ($_.FullyQualifiedErrorId -eq 'MaximumRedirectExceeded,Microsoft.PowerShell.Commands.InvokeWebRequestCommand') { $status = 302 }
                }
                return @{ status = $status; location = $loc }
            }
            $a1 = Invoke-FormFailedLogin @{ username = "nonexistent_user_xyz"; password = "wrong" }
            $a2 = Invoke-FormFailedLogin @{ username = "admin"; password = "wrongpassword_xyz" }
            $c1 = $a1.status; $c2 = $a2.status
            $pass = ($c1 -eq $c2)
            $evidence = "status $c1 vs $c2 (form login redirects to error page)"
        }
        else {
            $loginUrl = "$apiUrl$($app.auth.loginPath)"
            $badUser = @{ username = "nonexistent_user_xyz"; password = "wrong" } | ConvertTo-Json
            $badPass = @{ username = "admin"; password = "wrongpassword_xyz" } | ConvertTo-Json
            if ($app.auth.admin.email) {
                $badUser = @{ email = "nonexistent@example.com"; password = "wrong" } | ConvertTo-Json
                $badPass = @{ email = $app.auth.admin.email; password = "wrongpassword_xyz" } | ConvertTo-Json
            }
            $r1 = Invoke-AppRequest -Url $loginUrl -Method POST -Body $badUser
            $r2 = Invoke-AppRequest -Url $loginUrl -Method POST -Body $badPass
            $c1 = if ($r1.StatusCode) { $r1.StatusCode } else { 0 }
            $c2 = if ($r2.StatusCode) { $r2.StatusCode } else { 0 }
            $pass = ($c1 -eq $c2)
            $evidence = "status $c1 vs $c2"
        }
        Add-TestResult "M5" "Generic login errors" $(if ($pass) { "Pass" } else { "Fail" }) $evidence "A07"
    }
    catch {
        Add-TestResult "M5" "Generic login errors" "N/A" "Could not test: $_" "A07"
    }
}

# M6: SQLi in search
$searchPaths = @("/search?q=", "/catalog?search=", "/api/search?q=", "/api/products?search=")
$sqliBlocked = $true
$sqliEv = @()
foreach ($p in $searchPaths) {
    foreach ($payload in $payloads.sqli) {
        $url = "$baseUrl$p$([uri]::EscapeDataString($payload))"
        $r = Invoke-AppRequest -Url $url
        $body = if ($r.Content) { $r.Content } else { "" }
        $code = if ($r.StatusCode) { $r.StatusCode } else { 0 }
        $sqliEv += "$p$payload -> $code"
        if ($body -match "sql|syntax error|postgresql|sqlite|mysql|ORA-\d") { $sqliBlocked = $false }
    }
}
Add-TestResult "M6" "SQLi in search" $(if ($sqliBlocked) { "Pass" } else { "Fail" }) ($sqliEv | Select-Object -First 4) -join "; " "A03"

# M7: XSS in review
if (Feature-Na "reviews") {
    Add-TestResult "M7" "XSS in review" "N/A" "No reviews feature" "A03"
}
else {
    try {
        $session = New-AppSession -App $app -Role "customer"
        $xss = $payloads.xss[0]
        $productId = Get-FirstProductId -App $app -ApiUrl $apiUrl
        $reviewPaths = if ($productId) {
            @("/api/products/$productId/reviews")
        } else {
            @("/api/reviews", "/api/products/1/reviews")
        }
        $reflected = $false
        foreach ($p in $reviewPaths) {
            $body = @{ productId = 1; rating = 5; text = $xss; comment = $xss; content = $xss; title = "Probe title" }
            $r = Invoke-AppRequest -Url (AppApiUrl $p) -Method POST -Body $body -WebSession $session
            $content = if ($r.Content) { $r.Content } else { "" }
            if ($content -match "<script>alert\(1\)</script>" -and $content -notmatch "&lt;script") { $reflected = $true }
        }
        Add-TestResult "M7" "XSS in review" $(if (-not $reflected) { "Pass" } else { "Fail" }) "stored/reflected script check" "A03"
    }
    catch {
        Add-TestResult "M7" "XSS in review" "N/A" "Could not post review: $_" "A03"
    }
}

# M8: Insufficient balance checkout
if (Feature-Na "checkout") {
    Add-TestResult "M8" "Insufficient balance checkout" "N/A" "No checkout feature" "A04"
}
else {
    try {
        $session = New-AppSession -App $app -Role "customer"
        $checkoutPaths = @("/api/checkout", "/api/orders", "/checkout")
        $blocked = $false
        foreach ($p in $checkoutPaths) {
            $checkoutBody = if ($app.apiPrefix) {
                @{ items = @(@{ product_id = 1; quantity = 999 }) }
            }
            else {
                @{ items = @(@{ productId = 1; quantity = 999 }) }
            }
            $r = Invoke-AppRequest -Url (AppApiUrl $p) -Method POST -Body $checkoutBody -WebSession $session
            $code = if ($r.StatusCode) { $r.StatusCode } else { 0 }
            if ($code -ge 400) { $blocked = $true }
        }
        Add-TestResult "M8" "Insufficient balance checkout" $(if ($blocked) { "Pass" } else { "Fail" }) "checkout with large qty" "A04"
    }
    catch {
        Add-TestResult "M8" "Insufficient balance checkout" "N/A" "Could not test: $_" "A04"
    }
}

# M9: Race condition (parallel checkout)
if (Feature-Na "checkout") {
    Add-TestResult "M9" "Parallel checkout race" "N/A" "No checkout feature" "CWE-362"
}
else {
    try {
        $checkoutUrl = AppApiUrl "/api/checkout"
        $loginUrl = "$apiUrl$($app.auth.loginPath)"
        $customerCreds = $app.auth.customer
        if (-not $customerCreds) {
            throw "No customer credentials in manifest for $($app.name)"
        }

        $customerLoginBody = @{ password = $customerCreds.password }
        if ($customerCreds.username) { $customerLoginBody.username = $customerCreds.username }
        if ($customerCreds.email) { $customerLoginBody.email = $customerCreds.email }
        $customerLoginJson = $customerLoginBody | ConvertTo-Json -Compress

        # Set customer balance high enough for one checkout (product 1 ~= $250; use $300).
        if ($app.auth.admin -and $app.auth.loginMethod -in @("json", "bearer")) {
            try {
                $adminSession = New-AppSession -App $app -Role "admin"
                $usersResp = Invoke-AppRequest -Url (AppApiUrl "/api/admin/users") -WebSession $adminSession
                $usersContent = if ($usersResp.Content) { $usersResp.Content } else { "" }
                if ($usersContent) {
                    $usersData = $usersContent | ConvertFrom-Json
                    $usersList = if ($usersData.users) { $usersData.users } else { @($usersData) }
                    $customerKey = if ($customerCreds.username) { $customerCreds.username } else { $customerCreds.email }
                    $customerUser = $usersList | Where-Object {
                        $_.username -eq $customerKey -or $_.email -eq $customerKey
                    } | Select-Object -First 1
                    if ($customerUser) {
                        if ($app.apiPrefix) {
                            Invoke-AppRequest -Url "$(AppApiUrl "/api/admin/users/$($customerUser.id)")/balance" -Method PATCH `
                                -Body @{ balance = 300 } -WebSession $adminSession | Out-Null
                        }
                        else {
                            Invoke-AppRequest -Url (AppApiUrl "/api/admin/users/$($customerUser.id)") -Method PATCH `
                                -Body @{ balance_cents = 30000 } -WebSession $adminSession | Out-Null
                        }
                    }
                }
            }
            catch {
                # Balance reset is best-effort; race test still runs with the current account balance.
            }
        }

        $checkoutItemJson = if ($app.apiPrefix) {
            '{"items":[{"product_id":1,"quantity":1}]}'
        }
        else {
            '{"items":[{"productId":1,"quantity":1}]}'
        }

        if ($app.auth.loginMethod -in @("nextauth", "form")) {
            $custSession = New-AppSession -App $app -Role "customer"
            $cookieHeader = ($custSession.Cookies.GetCookies($apiUrl) | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join "; "
            $jobs = 1..5 | ForEach-Object {
                Start-Job -ScriptBlock {
                    param($CheckoutUrl, $Cookies)
                    $headers = @{ Cookie = $Cookies }
                    try {
                        $r = Invoke-WebRequest -Uri $CheckoutUrl -Method POST -Headers $headers `
                            -ContentType "application/json" `
                            -Body $checkoutItemJson -UseBasicParsing -TimeoutSec 30
                        return $r.StatusCode
                    }
                    catch {
                        if ($_.Exception.Response) { return $_.Exception.Response.StatusCode.value__ }
                        return 0
                    }
                } -ArgumentList $checkoutUrl, $cookieHeader
            }
        }
        elseif ($app.auth.loginMethod -eq "bearer") {
            $custSession = New-AppSession -App $app -Role "customer"
            $authHeader = "Bearer $($custSession.BearerToken)"
            $jobs = 1..5 | ForEach-Object {
                Start-Job -ScriptBlock {
                    param($CheckoutUrl, $Authorization)
                    $headers = @{ Authorization = $Authorization }
                    try {
                        $r = Invoke-WebRequest -Uri $CheckoutUrl -Method POST -Headers $headers `
                            -ContentType "application/json" `
                            -Body '{}' -UseBasicParsing -TimeoutSec 30
                        return $r.StatusCode
                    }
                    catch {
                        if ($_.Exception.Response) { return $_.Exception.Response.StatusCode.value__ }
                        return 0
                    }
                } -ArgumentList $checkoutUrl, $authHeader
            }
        }
        else {
            $jobs = 1..5 | ForEach-Object {
                Start-Job -ScriptBlock {
                    param($CheckoutUrl, $LoginUrl, $LoginJson)
                    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                    Invoke-WebRequest -Uri $LoginUrl -Method POST `
                        -ContentType "application/json" -Body $LoginJson -WebSession $session -UseBasicParsing -TimeoutSec 30 | Out-Null
                    try {
                        $r = Invoke-WebRequest -Uri $CheckoutUrl -Method POST -WebSession $session `
                            -ContentType "application/json" `
                            -Body $checkoutItemJson -UseBasicParsing -TimeoutSec 30
                        return $r.StatusCode
                    }
                    catch {
                        if ($_.Exception.Response) { return $_.Exception.Response.StatusCode.value__ }
                        return 0
                    }
                } -ArgumentList $checkoutUrl, $loginUrl, $customerLoginJson
            }
        }
        $codes = $jobs | Wait-Job -Timeout 120 | Receive-Job
        $jobs | Remove-Job -Force
        $successCount = ($codes | Where-Object { $_ -eq 200 -or $_ -eq 201 }).Count
        $authFailures = ($codes | Where-Object { $_ -eq 401 }).Count
        $pass = ($successCount -le 1) -and ($authFailures -lt 5)
        $evidence = "codes: $($codes -join ','); $successCount successes of 5 parallel"
        if ($authFailures -eq 5) { $evidence += "; all requests unauthenticated" }
        Add-TestResult "M9" "Parallel checkout race" $(if ($pass) { "Pass" } else { "Fail" }) $evidence "CWE-362"
    }
    catch {
        Add-TestResult "M9" "Parallel checkout race" "N/A" "Could not test: $_" "CWE-362"
    }
}

# M10: Path traversal
if (Feature-Na "invoice") {
    Add-TestResult "M10" "Path traversal download" "N/A" "No invoice/download feature" "CWE-22"
}
else {
    $traversalBlocked = $true
    $tev = @()
    foreach ($payload in $payloads.pathTraversal) {
        $paths = @(
            "/api/invoices/1/pdf?file=$payload",
            "/api/invoices/download?path=$payload",
            "/api/files?path=$payload",
            "/api/invoices/$payload"
        )
        foreach ($p in $paths) {
            $r = Invoke-AppRequest -Url (AppApiUrl $p)
            $body = if ($r.Content) { $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)) } else { "" }
            $tev += "$p -> $($r.StatusCode)"
            if ($body -match "root:|/bin/bash|\[extensions\]") { $traversalBlocked = $false }
        }
    }
    Add-TestResult "M10" "Path traversal download" $(if ($traversalBlocked) { "Pass" } else { "Fail" }) ($tev | Select-Object -First 3) -join "; " "CWE-22"
}

# M11: Malicious filename upload
$hasUploadSurface = (-not (Feature-Na "reviews")) -or (-not (Feature-Na "auth"))
if (-not $hasUploadSurface) {
    Add-TestResult "M11" "Malicious filename upload" "N/A" "No upload surface" "CWE-98"
}
else {
    try {
        $probeDir = New-ProbeWorkDir -AppName $AppName
        $appRoot = Get-AppRoot -App $app
        $uploadDirs = Get-AppUploadDirs -AppRoot $appRoot
        $tinyImage = New-ProbeTinyImage -WorkDir $probeDir
        $productSlug = Get-FirstProductSlug -ApiUrl $apiUrl -App $app
        $targets = Get-MultipartUploadTargets -App $app -ApiUrl $apiUrl -ProductSlug $productSlug |
            Where-Object { -not $_.IsCsv }

        $m11Pass = $true
        $m11Ev = @()
        $tested = 0

        foreach ($target in $targets) {
            $cookieJar = Join-Path $probeDir "m11-$($target.Role)-$($target.Field).cookies.txt"
            try {
                Initialize-CurlSessionForApp -App $app -Role $target.Role -CookieJarPath $cookieJar
            }
            catch {
                $m11Ev += "$($target.Path): login failed"
                continue
            }

            $url = AppApiUrl $target.Path
            foreach ($name in $payloads.maliciousFilenames) {
                $extra = @{}
                if ($target.ExtraFields) {
                    foreach ($k in $target.ExtraFields.Keys) { $extra[$k] = $target.ExtraFields[$k] }
                }
                $result = Invoke-CurlMultipartUpload -Url $url -CookieJarPath $cookieJar `
                    -FieldName $target.Field -FilePath $tinyImage -RemoteFileName $name `
                    -ContentType $target.ContentType -ExtraFields $extra
                $check = Test-MaliciousFilenameBlocked -MaliciousName $name -UploadResult $result -UploadDirs $uploadDirs
                $m11Ev += "$($target.Path) [$name] -> HTTP $($result.StatusCode); $($check.Reason)"
                if (-not $check.Pass) { $m11Pass = $false }
                $tested++
            }
        }

        if ($tested -eq 0) {
            Add-TestResult "M11" "Malicious filename upload" "N/A" "No reachable upload endpoint" "CWE-98"
        }
        else {
            Add-TestResult "M11" "Malicious filename upload" $(if ($m11Pass) { "Pass" } else { "Fail" }) ($m11Ev | Select-Object -First 4) -join "; " "CWE-98"
        }
    }
    catch {
        Add-TestResult "M11" "Malicious filename upload" "N/A" "Could not test: $_" "CWE-98"
    }
}

# M12: Oversized upload
$hasUploadSurface = (-not (Feature-Na "reviews")) -or (-not (Feature-Na "auth")) -or (-not (Feature-Na "csvImport"))
if (-not $hasUploadSurface) {
    Add-TestResult "M12" "Oversized file upload" "N/A" "No upload surface" "CWE-400"
}
else {
    try {
        $probeDir = New-ProbeWorkDir -AppName $AppName
        $oversizedBytes = [int]$payloads.oversizedUploadBytes
        if ($oversizedBytes -lt 1) { $oversizedBytes = 11534336 }
        $bigImage = New-ProbeOversizedFile -WorkDir $probeDir -ByteCount $oversizedBytes -Extension ".jpg"
        $bigCsv = New-ProbeOversizedFile -WorkDir $probeDir -ByteCount $oversizedBytes -Extension ".csv"
        $productSlug = Get-FirstProductSlug -ApiUrl $apiUrl -App $app
        $targets = Get-MultipartUploadTargets -App $app -ApiUrl $apiUrl -ProductSlug $productSlug

        $m12Pass = $true
        $m12Ev = @()
        $tested = 0

        foreach ($target in $targets) {
            $cookieJar = Join-Path $probeDir "m12-$($target.Role)-$($target.Field).cookies.txt"
            try {
                Initialize-CurlSessionForApp -App $app -Role $target.Role -CookieJarPath $cookieJar
            }
            catch {
                $m12Ev += "$($target.Path): login failed"
                continue
            }

            $filePath = if ($target.IsCsv) { $bigCsv } else { $bigImage }
            $contentType = if ($target.IsCsv) { "text/csv" } else { $target.ContentType }
            $url = AppApiUrl $target.Path
            $extra = @{}
            if ($target.ExtraFields) {
                foreach ($k in $target.ExtraFields.Keys) { $extra[$k] = $target.ExtraFields[$k] }
            }

            $result = Invoke-CurlMultipartUpload -Url $url -CookieJarPath $cookieJar `
                -FieldName $target.Field -FilePath $filePath -ContentType $contentType -ExtraFields $extra
            $rejected = ($result.StatusCode -ge 400) -or ($result.Content -match "too large|smaller|size|limit|MB|413")
            $m12Ev += "$($target.Path) -> HTTP $($result.StatusCode)"
            if (-not $rejected) { $m12Pass = $false }
            $tested++
        }

        if ($tested -eq 0) {
            Add-TestResult "M12" "Oversized file upload" "N/A" "No reachable upload endpoint" "CWE-400"
        }
        else {
            Add-TestResult "M12" "Oversized file upload" $(if ($m12Pass) { "Pass" } else { "Fail" }) ($m12Ev -join "; ") "CWE-400"
        }
    }
    catch {
        Add-TestResult "M12" "Oversized file upload" "N/A" "Could not test: $_" "CWE-400"
    }
}

# M13: Malformed CSV import
if (Feature-Na "csvImport") {
    Add-TestResult "M13" "Malformed CSV import" "N/A" "No CSV import feature" "A08"
}
else {
    try {
        $probeDir = New-ProbeWorkDir -AppName $AppName
        $fixtures = New-M13CsvFixtures -WorkDir $probeDir -FormulaPayload $payloads.csvInjection
        $cookieJar = Join-Path $probeDir "m13-admin.cookies.txt"
        Initialize-CurlSessionForApp -App $app -Role "admin" -CookieJarPath $cookieJar

        $importPaths = if ($app.apiPrefix) {
            @("/api/admin/products/csv-import")
        }
        else {
            @("/api/admin/products/import", "/api/admin/products/import-csv")
        }
        $importUrl = $null
        foreach ($p in $importPaths) {
            $probe = Invoke-CurlMultipartUpload -Url (AppApiUrl $p) -CookieJarPath $cookieJar `
                -FieldName "file" -FilePath $fixtures.Corrupt -ContentType "text/csv"
            if ($probe.StatusCode -ne 404) {
                $importUrl = AppApiUrl $p
                break
            }
        }
        if (-not $importUrl) {
            throw "No CSV import endpoint responded."
        }

        $corrupt = Invoke-CurlMultipartUpload -Url $importUrl -CookieJarPath $cookieJar `
            -FieldName "file" -FilePath $fixtures.Corrupt -ContentType "text/csv"
        $formula = Invoke-CurlMultipartUpload -Url $importUrl -CookieJarPath $cookieJar `
            -FieldName "file" -FilePath $fixtures.Formula -ContentType "text/csv"
        $oversized = Invoke-CurlMultipartUpload -Url $importUrl -CookieJarPath $cookieJar `
            -FieldName "file" -FilePath $fixtures.OversizedRow -ContentType "text/csv"

        $corruptJson = $null
        $formulaJson = $null
        try { if ($corrupt.Content) { $corruptJson = $corrupt.Content | ConvertFrom-Json } } catch { }
        try { if ($formula.Content) { $formulaJson = $formula.Content | ConvertFrom-Json } } catch { }

        $corruptOk = ($corrupt.StatusCode -ge 400) -or (
            $corruptJson -and ($corruptJson.failed -ge 1 -or $corruptJson.error)
        )
        $formulaOk = ($formula.StatusCode -ge 400) -or (
            $formulaJson -and ($formulaJson.ok -eq $true -or $formulaJson.created -ge 0) -and (-not $formulaJson.error)
        )
        $oversizedJsonOk = $false
        try {
            if ($oversized.Content) {
                $oj = $oversized.Content | ConvertFrom-Json
                $oversizedJsonOk = ($oj.failed -ge 1) -or [bool]$oj.error
            }
        }
        catch { }

        $oversizedOk = ($oversized.StatusCode -ge 400) -or (
            $oversized.Content -match "2000|too long|smaller|description"
        ) -or $oversizedJsonOk

        $m13Pass = $corruptOk -and $formulaOk -and $oversizedOk
        $m13Ev = @(
            "corrupt HTTP $($corrupt.StatusCode) failed=$($corruptJson.failed)"
            "formula HTTP $($formula.StatusCode) created=$($formulaJson.created)"
            "oversized HTTP $($oversized.StatusCode)"
        ) -join "; "

        Add-TestResult "M13" "Malformed CSV import" $(if ($m13Pass) { "Pass" } else { "Fail" }) $m13Ev "A08"
    }
    catch {
        Add-TestResult "M13" "Malformed CSV import" "N/A" "Could not test: $_" "A08"
    }
}

# M14: SSRF
if (Feature-Na "ssrf") {
    Add-TestResult "M14" "SSRF internal URL" "N/A" "No SSRF feature" "A10"
}
else {
    $ssrfBlocked = $true
    $sev = @()
    foreach ($url in $payloads.ssrf) {
        $paths = @("/api/fetch", "/api/preview", "/api/proxy", "/api/integrations/fetch")
        foreach ($p in $paths) {
            $r = Invoke-AppRequest -Url (AppApiUrl $p) -Method POST -Body @{ url = $url }
            $body = if ($r.Content) { $r.Content } else { "" }
            $sev += "$p $url -> $($r.StatusCode)"
            if ($body -match "SSH-|ami-id|localhost") { $ssrfBlocked = $false }
        }
    }
    Add-TestResult "M14" "SSRF internal URL" $(if ($ssrfBlocked) { "Pass" } else { "Fail" }) ($sev | Select-Object -First 3) -join "; " "A10"
}

# M15: Audit logging
if (Feature-Na "auditLog") {
    Add-TestResult "M15" "Failed login audit log" "N/A" "No audit log feature" "A09"
}
else {
    try {
        if ($app.auth.loginMethod -eq "nextauth") {
            1..3 | ForEach-Object {
                $attemptSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                $csrf = (Invoke-RestMethod -Uri "$apiUrl/api/auth/csrf" -WebSession $attemptSession -TimeoutSec 30).csrfToken
                $form = @{
                    csrfToken = $csrf
                    username = "bad_user_audit_$_"
                    password = "bad"
                    callbackUrl = "$baseUrl/"
                    json = "true"
                }
                try {
                    Invoke-WebRequest -Uri "$apiUrl/api/auth/callback/credentials" -Method POST `
                        -Body $form -WebSession $attemptSession -UseBasicParsing `
                        -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction SilentlyContinue | Out-Null
                }
                catch { }
            }
        }
        elseif ($app.auth.loginMethod -eq "form") {
            $loginUrl = "$apiUrl$($app.auth.loginPath)"
            1..3 | ForEach-Object {
                $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                try {
                    Invoke-WebRequest -Uri $loginUrl -Method POST `
                        -Body @{ username = "bad_user_audit_$_"; password = "bad" } `
                        -ContentType "application/x-www-form-urlencoded" -WebSession $s `
                        -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -ErrorAction SilentlyContinue | Out-Null
                }
                catch { }
            }
        }
        else {
            $loginUrl = "$apiUrl$($app.auth.loginPath)"
            1..3 | ForEach-Object {
                Invoke-AppRequest -Url $loginUrl -Method POST -Body (@{ username = "bad"; password = "bad" } | ConvertTo-Json) | Out-Null
            }
        }
        $adminSession = New-AppSession -App $app -Role "admin"
        $logPaths = @("/api/admin/logs", "/api/admin/events")
        $found = $false
        foreach ($p in $logPaths) {
            $r = Invoke-AppRequest -Url (AppApiUrl $p) -WebSession $adminSession
            if ($r.Content -match "login|auth|failed|FAIL") { $found = $true }
        }
        Add-TestResult "M15" "Failed login audit log" $(if ($found) { "Pass" } else { "Fail" }) "audit API content check" "A09"
    }
    catch {
        Add-TestResult "M15" "Failed login audit log" "N/A" "Could not test: $_" "A09"
    }
}

# M16: Temp file cleanup
$hasM16Surface = (-not (Feature-Na "csvImport")) -or (-not (Feature-Na "invoice")) -or (-not (Feature-Na "auth"))
if (-not $hasM16Surface) {
    Add-TestResult "M16" "Temp file cleanup" "N/A" "No CSV import, invoice, or upload feature" "CWE-459"
}
else {
    try {
        $probeDir = New-ProbeWorkDir -AppName $AppName
        $appRoot = Get-AppRoot -App $app
        $before = Get-SuspectTempFiles -AppRoot $appRoot
        $ops = @()

        if (-not (Feature-Na "csvImport")) {
            try {
                $fixtures = New-M13CsvFixtures -WorkDir $probeDir -FormulaPayload $payloads.csvInjection
                $cookieJar = Join-Path $probeDir "m16-admin.cookies.txt"
                Initialize-CurlSessionForApp -App $app -Role "admin" -CookieJarPath $cookieJar
                $csvImportPaths = if ($app.apiPrefix) {
                    @("/api/admin/products/csv-import")
                }
                else {
                    @("/api/admin/products/import", "/api/admin/products/import-csv")
                }
                foreach ($p in $csvImportPaths) {
                    $r = Invoke-CurlMultipartUpload -Url (AppApiUrl $p) -CookieJarPath $cookieJar `
                        -FieldName "file" -FilePath $fixtures.Corrupt -ContentType "text/csv"
                    if ($r.StatusCode -ne 404) {
                        $ops += "csv-import"
                        break
                    }
                }
            }
            catch {
                $ops += "csv-import-skipped"
            }
        }

        if (-not (Feature-Na "auth")) {
            try {
                $tinyImage = New-ProbeTinyImage -WorkDir $probeDir
                $cookieJar = Join-Path $probeDir "m16-customer.cookies.txt"
                Initialize-CurlSessionForApp -App $app -Role "customer" -CookieJarPath $cookieJar
                $r = Invoke-CurlMultipartUpload -Url (AppApiUrl "/api/users/me/avatar") -CookieJarPath $cookieJar `
                    -FieldName "avatar" -FilePath $tinyImage -ContentType "image/jpeg"
                if ($r.StatusCode -in 200, 201) { $ops += "avatar-upload" }
            }
            catch {
                $ops += "avatar-upload-skipped"
            }
        }

        if (-not (Feature-Na "invoice")) {
            try {
                $cookieJar = Join-Path $probeDir "m16-invoice.cookies.txt"
                Initialize-CurlSessionForApp -App $app -Role "customer" -CookieJarPath $cookieJar
                $orderId = Get-FirstOrderId -ApiUrl $apiUrl -CookieJarPath $cookieJar
                if ($orderId) {
                    $curl = Get-CurlExe
                    $invoicePath = if ($app.stack -eq "nextjs") {
                        "$apiUrl/api/invoices/$orderId"
                    } else {
                        AppApiUrl "/api/orders/$orderId/invoice"
                    }
                    $code = & $curl -s -o NUL -w "%{http_code}" -b $cookieJar $invoicePath
                    $ops += "invoice-$orderId->$code"
                }
                else {
                    $ops += "invoice-no-order"
                }
            }
            catch {
                $ops += "invoice-skipped"
            }
        }

        $after = Get-SuspectTempFiles -AppRoot $appRoot
        $beforePaths = @($before | ForEach-Object { $_.FullName })
        $newSuspects = @($after | Where-Object { $beforePaths -notcontains $_.FullName })

        $uploadCsvLeft = @($after | Where-Object {
            $_.FullName -match "\\uploads\\" -and $_.Extension -eq ".csv"
        })

        $m16Pass = ($newSuspects.Count -eq 0) -and ($uploadCsvLeft.Count -eq 0)
        $m16Ev = "ops: $($ops -join ', '); newSuspects=$($newSuspects.Count); uploadCsv=$($uploadCsvLeft.Count)"
        if ($newSuspects.Count -gt 0) {
            $m16Ev += "; files: $(($newSuspects | Select-Object -First 2 | ForEach-Object { $_.FullName }) -join ', ')"
        }

        Add-TestResult "M16" "Temp file cleanup" $(if ($m16Pass) { "Pass" } else { "Fail" }) $m16Ev "CWE-459"
    }
    catch {
        Add-TestResult "M16" "Temp file cleanup" "N/A" "Could not test: $_" "CWE-459"
    }
}

$checklist = @{
    app = $app.name
    testedAt = (Get-Date).ToString("o")
    pass = @($results | Where-Object { $_.result -eq "Pass" }).Count
    fail = @($results | Where-Object { $_.result -eq "Fail" }).Count
    na = @($results | Where-Object { $_.result -eq "N/A" }).Count
    tests = $results
}

$checklist | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $manualDir "checklist.json") -Encoding UTF8
$results | Export-Csv (Join-Path $manualDir "checklist.csv") -NoTypeInformation -Encoding UTF8

Write-Host "Manual probes for $($app.name): $($checklist.pass) pass, $($checklist.fail) fail, $($checklist.na) N/A"
