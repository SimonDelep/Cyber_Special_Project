function Set-SessionBearerToken {
    param(
        $WebSession,
        [string]$Token
    )

    if ($WebSession | Get-Member -Name BearerToken -MemberType NoteProperty) {
        $WebSession.BearerToken = $Token
    }
    else {
        $WebSession | Add-Member -NotePropertyName BearerToken -NotePropertyValue $Token
    }
}

function Get-AppLoginBody {
    param(
        $App,
        $Creds
    )

    $body = @{ password = $creds.password }
    if ($creds.username) { $body.username = $creds.username }
    if ($creds.email) { $body.email = $creds.email }
    return $body
}

function Register-TestCustomer {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        $WebSession
    )

    $creds = $App.auth.customer
    if (-not $creds) { return $false }

    $registerUrl = "$($App.apiUrl)$($App.auth.loginPath -replace '/login$', '/register')"

    if ($App.auth.loginMethod -eq "form") {
        $form = @{
            username = $creds.username
            password = $creds.password
            display_name = "Test Customer"
            email = if ($creds.email) { $creds.email } else { "$($creds.username)@example.com" }
        }
        try {
            Invoke-WebRequest -Uri $registerUrl -Method POST `
                -ContentType "application/x-www-form-urlencoded" `
                -Body $form -WebSession $WebSession `
                -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0 -ErrorAction Stop | Out-Null
            return $true
        }
        catch {
            $status = 0
            if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
            elseif ($_.FullyQualifiedErrorId -eq 'MaximumRedirectExceeded,Microsoft.PowerShell.Commands.InvokeWebRequestCommand') { $status = 302 }
            return ($status -in 301, 302, 303, 307, 308)
        }
    }
    $body = @{
        username = $creds.username
        password = $creds.password
        confirmPassword = $creds.password
        email = if ($creds.email) { $creds.email } else { "$($creds.username)@example.com" }
        displayName = "Test Customer"
        full_name = "Test Customer"
        fullName = "Test Customer"
    }
    if ($creds.email) {
        $body = @{
            email = $creds.email
            password = $creds.password
            full_name = "Test Customer"
            fullName = "Test Customer"
            displayName = "Test Customer"
            confirmPassword = $creds.password
        }
    }

    try {
        Invoke-WebRequest -Uri $registerUrl -Method POST `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json) `
            -WebSession $WebSession `
            -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function New-AppSession {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        [ValidateSet("admin", "customer")]
        [string]$Role = "admin"
    )

    $baseUrl = $App.apiUrl
    $creds = $App.auth.$Role
    if (-not $creds) {
        throw "No $Role credentials in manifest for $($App.name)"
    }

    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    switch ($App.auth.loginMethod) {
        { $_ -in @("json", "bearer") } {
            $body = Get-AppLoginBody -App $App -Creds $creds
            $loginUrl = "$baseUrl$($App.auth.loginPath)"
            $json = $body | ConvertTo-Json

            function Invoke-AppJsonLogin {
                param([switch]$UseAltIdentifier)

                if ($App.auth.loginMethod -eq "bearer") {
                    $loginBody = if ($UseAltIdentifier) {
                        @{
                            email = if ($creds.email) { $creds.email } else { $null }
                            username = if ($creds.username) { $creds.username } else { $null }
                            identifier = if ($creds.email) { $creds.email } else { $creds.username }
                            password = $creds.password
                        }
                    }
                    else { $body }
                    $resp = Invoke-RestMethod -Uri $loginUrl -Method POST `
                        -ContentType "application/json" `
                        -Body ($loginBody | ConvertTo-Json) `
                        -TimeoutSec 30 -ErrorAction Stop
                    if (-not $resp.access_token) {
                        throw "No access_token in login response"
                    }
                    Set-SessionBearerToken -WebSession $session -Token $resp.access_token
                    return
                }

                Invoke-WebRequest -Uri $loginUrl -Method POST `
                    -ContentType "application/json" `
                    -Body $json `
                    -WebSession $session `
                    -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop | Out-Null
            }

            try {
                Invoke-AppJsonLogin
            }
            catch {
                if ($Role -eq "customer") {
                    Register-TestCustomer -App $App -WebSession $session | Out-Null
                    Invoke-AppJsonLogin
                }
                else {
                    Invoke-AppJsonLogin -UseAltIdentifier
                }
            }
        }
        "form" {
            $loginUrl = "$baseUrl$($App.auth.loginPath)"

            function Invoke-AppFormLogin {
                $form = @{ password = $creds.password }
                if ($creds.username) { $form.username = $creds.username }
                if ($creds.email) { $form.email = $creds.email }

                try {
                    Invoke-WebRequest -Uri $loginUrl -Method POST `
                        -ContentType "application/x-www-form-urlencoded" `
                        -Body $form -WebSession $session `
                        -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0 -ErrorAction Stop | Out-Null
                }
                catch {
                    $status = 0
                    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
                    elseif ($_.FullyQualifiedErrorId -eq 'MaximumRedirectExceeded,Microsoft.PowerShell.Commands.InvokeWebRequestCommand') { $status = 302 }
                    if ($status -notin 301, 302, 303, 307, 308) { throw }
                }
            }

            try {
                Invoke-AppFormLogin
            }
            catch {
                if ($Role -eq "customer") {
                    Register-TestCustomer -App $App -WebSession $session | Out-Null
                    Invoke-AppFormLogin
                }
                else {
                    throw
                }
            }
        }
        "nextauth" {
            function Invoke-NextAuthLogin {
                param($WebSession)
                $csrfResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf" -WebSession $WebSession -UseBasicParsing -TimeoutSec 30
                $csrf = ($csrfResp.Content | ConvertFrom-Json).csrfToken
                $form = @{
                    csrfToken = $csrf
                    password = $creds.password
                    callbackUrl = "$baseUrl/"
                    json = "true"
                }
                if ($creds.email) { $form.email = $creds.email }
                if ($creds.username) { $form.username = $creds.username }
                # Some Credentials providers use a single custom field name (e.g. "identifier").
                if ($creds.identifier) { $form.identifier = $creds.identifier }
                elseif ($creds.email) { $form.identifier = $creds.email }
                elseif ($creds.username) { $form.identifier = $creds.username }
                try {
                    Invoke-WebRequest -Uri "$baseUrl/api/auth/callback/credentials" `
                        -Method POST -Body $form -WebSession $WebSession -UseBasicParsing `
                        -TimeoutSec 30 -MaximumRedirection 0 -ErrorAction Stop | Out-Null
                }
                catch {
                    $status = 0
                    if ($_.Exception.Response) {
                        $status = [int]$_.Exception.Response.StatusCode
                    }
                    elseif ($_.FullyQualifiedErrorId -eq 'MaximumRedirectExceeded,Microsoft.PowerShell.Commands.InvokeWebRequestCommand') {
                        $status = 302
                    }
                    if ($status -notin 301, 302, 303, 307, 308) { throw }
                }

                $sessionCheck = Invoke-WebRequest -Uri "$baseUrl/api/auth/session" `
                    -WebSession $WebSession -UseBasicParsing -TimeoutSec 30
                $sessionUser = ($sessionCheck.Content | ConvertFrom-Json).user
                if (-not $sessionUser) {
                    throw "NextAuth login did not establish a session"
                }
            }

            try {
                Invoke-NextAuthLogin -WebSession $session
            }
            catch {
                if ($Role -eq "customer") {
                    Register-TestCustomer -App $App -WebSession $session | Out-Null
                    Invoke-NextAuthLogin -WebSession $session
                }
                else {
                    throw
                }
            }
        }
        default {
            throw "Unsupported login method: $($App.auth.loginMethod)"
        }
    }

    return $session
}

function Invoke-AppRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        $Body = $null,
        $WebSession = $null,
        [hashtable]$Headers = @{},
        [string]$ContentType = "application/json",
        [int]$MaximumRedirection = 5
    )

    $params = @{
        Uri = $Url
        Method = $Method
        UseBasicParsing = $true
        MaximumRedirection = $MaximumRedirection
        ErrorAction = "SilentlyContinue"
        TimeoutSec = 30
    }
    if ($WebSession) { $params.WebSession = $WebSession }
    if ($WebSession -and $WebSession.BearerToken -and -not $Headers.Authorization) {
        $Headers.Authorization = "Bearer $($WebSession.BearerToken)"
    }
    if ($Headers.Count) { $params.Headers = $Headers }
    if ($Body -ne $null) {
        if ($Body -is [string]) { $params.Body = $Body }
        else { $params.Body = ($Body | ConvertTo-Json); $params.ContentType = $ContentType }
    }

    try {
        return Invoke-WebRequest @params
    }
    catch {
        if ($_.Exception.Response) {
            return $_.Exception.Response
        }
        return $null
    }
}

