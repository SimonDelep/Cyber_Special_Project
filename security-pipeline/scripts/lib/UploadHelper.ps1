function Get-CurlExe {
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) {
        throw 'curl.exe is required for multipart upload probes (M11-M13).'
    }
    return $curl.Source
}

function New-ProbeWorkDir {
    param([string]$AppName)

    $dir = Join-Path (Get-ResultsDir -AppName $AppName) "manual\probe-files"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    return $dir
}

function New-ProbeTinyImage {
    param([string]$WorkDir)

    $path = Join-Path $WorkDir "probe-tiny.jpg"
    if (-not (Test-Path $path)) {
        # Minimal valid JPEG (1x1).
        $bytes = [Convert]::FromBase64String(
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
        )
        [System.IO.File]::WriteAllBytes($path, $bytes)
    }
    return $path
}

function New-ProbeOversizedFile {
    param(
        [string]$WorkDir,
        [int]$ByteCount,
        [string]$Extension = ".jpg"
    )

    $path = Join-Path $WorkDir "probe-oversized$Extension"
    if (-not (Test-Path $path) -or ((Get-Item $path).Length -ne $ByteCount)) {
        $stream = [System.IO.File]::Create($path)
        try {
            $chunk = New-Object byte[] 65536
            $remaining = $ByteCount
            while ($remaining -gt 0) {
                $write = [Math]::Min($remaining, $chunk.Length)
                $stream.Write($chunk, 0, $write)
                $remaining -= $write
            }
        }
        finally {
            $stream.Close()
        }
    }
    return $path
}

function New-M13CsvFixtures {
    param(
        [string]$WorkDir,
        [string]$FormulaPayload
    )

    $suffix = Get-Date -Format "yyyyMMddHHmmss"
    $corruptPath = Join-Path $WorkDir "m13-corrupt-$suffix.csv"
    $formulaPath = Join-Path $WorkDir "m13-formula-$suffix.csv"
    $oversizedPath = Join-Path $WorkDir "m13-oversized-row-$suffix.csv"

    $header = "name,slug,description,price_cents,category,image,featured"
    $corruptLines = @(
        $header
        ",bad-slug-$suffix,Missing name and bad price,not-a-number,doorbell-cameras,/images/products/novaring-lite.svg,false"
        "Extra Col Product,extra-col-$suffix,Has extra column,4999,doorbell-cameras,/images/products/novaring-lite.svg,false,EXTRA_COLUMN"
        "Bad Category,bad-cat-$suffix,Wrong category,4999,not-a-real-category,/images/products/novaring-lite.svg,false"
    )
    Set-Content -Path $corruptPath -Value $corruptLines -Encoding UTF8

    $formulaField = $FormulaPayload.Replace('"', '""')
    if ($formulaField -match '[,\r\n]') { $formulaField = "`"$formulaField`"" }
    $formulaLines = @(
        $header
        "$formulaField,formula-$suffix,CSV formula injection cell,1999,doorbell-cameras,/images/products/novaring-lite.svg,false"
    )
    Set-Content -Path $formulaPath -Value $formulaLines -Encoding UTF8

    $longDesc = ("A" * 3000)
    $oversizedLines = @(
        $header
        "Big Field Product,big-field-$suffix,$longDesc,4999,doorbell-cameras,/images/products/novaring-lite.svg,false"
    )
    Set-Content -Path $oversizedPath -Value $oversizedLines -Encoding UTF8

    return @{
        Corrupt = $corruptPath
        Formula = $formulaPath
        OversizedRow = $oversizedPath
    }
}

function Build-AppLoginJson {
    param(
        $App,
        [ValidateSet("admin", "customer")]
        [string]$Role
    )

    $creds = $App.auth.$Role
    if (-not $creds) { throw "No $Role credentials in manifest for $($App.name)" }

    $body = @{ password = $creds.password }
    if ($creds.username) { $body.username = $creds.username }
    if ($creds.email) { $body.email = $creds.email }
    return ($body | ConvertTo-Json -Compress)
}

function Export-WebSessionCookiesToJar {
    param(
        $WebSession,
        [string]$BaseUrl,
        [string]$JarPath
    )

    $uri = [Uri]$BaseUrl
    $hostName = $uri.Host
    $lines = @("# Netscape HTTP Cookie File", "")
    foreach ($cookie in $WebSession.Cookies.GetCookies($BaseUrl)) {
        $lines += "$hostName`tTRUE`t/`tFALSE`t0`t$($cookie.Name)`t$($cookie.Value)"
    }
    Set-Content -Path $JarPath -Value $lines -Encoding UTF8
}

function Initialize-CurlSessionForApp {
    param(
        $App,
        [ValidateSet("admin", "customer")]
        [string]$Role,
        [string]$CookieJarPath
    )

    if (Test-Path $CookieJarPath) { Remove-Item $CookieJarPath -Force -ErrorAction SilentlyContinue }

    if ($App.auth.loginMethod -eq "nextauth") {
        $session = New-AppSession -App $App -Role $Role
        Export-WebSessionCookiesToJar -WebSession $session -BaseUrl $App.apiUrl -JarPath $CookieJarPath
        return
    }

    if ($App.auth.loginMethod -eq "bearer") {
        $session = New-AppSession -App $App -Role $Role
        $tokenPath = [System.IO.Path]::ChangeExtension($CookieJarPath, ".token")
        Set-Content -Path $tokenPath -Value $session.BearerToken -Encoding UTF8 -NoNewline
        if (-not (Test-Path $CookieJarPath)) {
            Set-Content -Path $CookieJarPath -Value "# Netscape HTTP Cookie File`n" -Encoding UTF8
        }
        return
    }

    if ($App.auth.loginMethod -eq "form") {
        $curl = Get-CurlExe
        $loginUrl = "$($App.apiUrl)$($App.auth.loginPath)"
        $creds = $App.auth.$Role

        $formArgs = @("-X", "POST", "-d", "username=$($creds.username)", "-d", "password=$($creds.password)")
        if ($creds.email) { $formArgs += @("-d", "email=$($creds.email)") }

        $code = & $curl -s -o NUL -w "%{http_code}" --max-time 30 -c $CookieJarPath @formArgs $loginUrl
        if ($code -notin @("200", "201", "204", "302", "303")) {
            if ($Role -eq "customer") {
                $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
                Register-TestCustomer -App $App -WebSession $session | Out-Null
                $code = & $curl -s -o NUL -w "%{http_code}" --max-time 30 -c $CookieJarPath @formArgs $loginUrl
            }
        }
        if ($code -notin @("200", "201", "204", "302", "303")) {
            throw "Curl form login failed for $Role on $($App.name) (HTTP $code)."
        }
        return
    }

    $curl = Get-CurlExe
    $loginUrl = "$($App.apiUrl)$($App.auth.loginPath)"
    $loginJsonPath = [System.IO.Path]::ChangeExtension($CookieJarPath, ".login.json")
    $loginJson = Build-AppLoginJson -App $App -Role $Role
    Set-Content -Path $loginJsonPath -Value $loginJson -NoNewline -Encoding UTF8

    $code = & $curl -s -o NUL -w "%{http_code}" --max-time 30 -c $CookieJarPath -X POST $loginUrl `
        -H "Content-Type: application/json" `
        --data-binary "@$loginJsonPath"

    if ($code -notin @("200", "201", "204")) {
        if ($Role -eq "customer") {
            $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
            Register-TestCustomer -App $App -WebSession $session | Out-Null
        }
        $code = & $curl -s -o NUL -w "%{http_code}" --max-time 30 -c $CookieJarPath -X POST $loginUrl `
            -H "Content-Type: application/json" `
            --data-binary "@$loginJsonPath"
    }

    if ($code -notin @("200", "201", "204")) {
        throw "Curl login failed for $Role on $($App.name) (HTTP $code)."
    }
}

function Invoke-CurlMultipartUpload {
    param(
        [string]$Url,
        [string]$CookieJarPath,
        [string]$FieldName,
        [string]$FilePath,
        [string]$RemoteFileName = $null,
        [string]$ContentType = "application/octet-stream",
        [hashtable]$ExtraFields = @{}
    )

    $curl = Get-CurlExe
    $tokenPath = [System.IO.Path]::ChangeExtension($CookieJarPath, ".token")
    $bearerToken = if (Test-Path $tokenPath) { Get-Content $tokenPath -Raw } else { $null }

    $args = @(
        "-s",
        "--max-time", "60",
        "-w", "`nHTTP:%{http_code}",
        "-b", $CookieJarPath,
        "-X", "POST",
        $Url
    )

    if ($bearerToken) {
        $args += "-H"
        $args += "Authorization: Bearer $bearerToken"
    }

    foreach ($key in $ExtraFields.Keys) {
        $args += "-F"
        $args += "$key=$($ExtraFields[$key])"
    }

    $filePart = if ($RemoteFileName) {
        "$FieldName=@$FilePath;filename=$RemoteFileName;type=$ContentType"
    }
    else {
        "$FieldName=@$FilePath;type=$ContentType"
    }
    $args += "-F"
    $args += $filePart

    $raw = & $curl @args 2>&1
    $text = ($raw | Out-String).Trim()
    $status = 0
    if ($text -match "HTTP:(\d+)\s*$") {
        $status = [int]$Matches[1]
        $text = ($text -replace "HTTP:\d+\s*$", "").Trim()
    }
    return @{
        StatusCode = $status
        Content = $text
    }
}

function Get-FirstProductId {
    param(
        $App,
        [string]$ApiUrl
    )

    if ($App.stack -eq "nextjs") {
        try {
            $probeDir = New-ProbeWorkDir -AppName $App.name
            $cookieJar = Join-Path $probeDir "product-id-admin.cookies.txt"
            Initialize-CurlSessionForApp -App $App -Role "admin" -CookieJarPath $cookieJar
            $curl = Get-CurlExe
            $productsUrl = if ($App.apiPrefix) {
                Resolve-AppApiUrl -App $App -LegacyPath "/api/admin/products"
            }
            else {
                "$ApiUrl/api/admin/products"
            }
            $raw = & $curl -s --max-time 30 -b $cookieJar $productsUrl
            if ($raw) {
                $json = $raw | ConvertFrom-Json
                if ($json.products) {
                    $product = $json.products | Select-Object -First 1
                    if ($product.id) { return [string]$product.id }
                }
            }
        }
        catch { }
    }
    elseif ($App.apiPrefix) {
        try {
            $productsUrl = Resolve-AppApiUrl -App $App -LegacyPath "/api/products"
            $r = Invoke-AppRequest -Url $productsUrl
            if ($r.Content) {
                $json = $r.Content | ConvertFrom-Json
                $product = if ($json.products) { $json.products | Select-Object -First 1 } else { @($json) | Select-Object -First 1 }
                if ($product.id) { return [string]$product.id }
            }
        }
        catch { }
    }

    return $null
}

function Get-FirstProductSlug {
    param(
        [string]$ApiUrl,
        $WebSession = $null,
        $App = $null
    )

    $paths = @("/api/catalog", "/api/products", "/api/catalog?limit=1")
    foreach ($p in $paths) {
        try {
            $url = if ($App) { Resolve-AppApiUrl -App $App -LegacyPath $p } else { "$ApiUrl$p" }
            $r = Invoke-AppRequest -Url $url -WebSession $WebSession
            if (-not $r.Content) { continue }
            $json = $r.Content | ConvertFrom-Json
            $product = $null
            if ($json.products) { $product = $json.products | Select-Object -First 1 }
            elseif ($json.items) { $product = $json.items | Select-Object -First 1 }
            elseif ($json -is [array]) { $product = $json | Select-Object -First 1 }
            if ($product -and $product.slug) { return [string]$product.slug }
        }
        catch { }
    }
    return "novaring-lite"
}

function Get-MultipartUploadTargets {
    param(
        $App,
        [string]$ApiUrl,
        [string]$ProductSlug
    )

    $targets = @()

    if ($App.features.auth) {
        if ($App.stack -eq "nextjs") {
            $targets += @(
                @{ Path = "/api/profile/upload"; Field = "file"; Role = "customer"; ContentType = "image/jpeg" }
            )
        }
        else {
            if ($App.apiPrefix) {
                $targets += @(
                    @{ Path = "/api/users/me/avatar"; Field = "file"; Role = "customer"; ContentType = "image/jpeg" }
                )
            }
            else {
                $targets += @(
                    @{ Path = "/api/profile/avatar"; Field = "avatar"; Role = "customer"; ContentType = "image/jpeg" },
                    @{ Path = "/api/profile/avatar"; Field = "avatar_file"; Role = "customer"; ContentType = "image/jpeg" }
                )
            }
        }
    }

    if ($App.features.reviews) {
        if ($App.stack -eq "nextjs") {
            $targets += @(
                @{ Path = "/api/reviews/upload"; Field = "file"; Role = "customer"; ContentType = "image/jpeg" }
            )
        }
        else {
            if ($App.apiPrefix) {
                $productId = Get-FirstProductId -App $App -ApiUrl $ApiUrl
                if ($productId) {
                    $targets += @(
                        @{
                            Path = "/api/products/$productId/reviews"
                            Field = "image"
                            Role = "customer"
                            ContentType = "image/jpeg"
                            ExtraFields = @{
                                rating = "5"
                                comment = "Security probe upload test with enough characters."
                            }
                        }
                    )
                }
            }
            else {
                $targets += @(
                    @{
                        Path = "/api/products/$ProductSlug/reviews"
                        Field = "image"
                        Role = "customer"
                        ContentType = "image/jpeg"
                        ExtraFields = @{
                            rating = "5"
                            body = "Security probe upload test with enough characters."
                        }
                    },
                    @{ Path = "/api/reviews"; Field = "image"; Role = "customer"; ContentType = "image/jpeg" }
                )
            }
        }
    }

    if ($App.features.csvImport) {
        $csvPaths = @("/api/admin/products/import", "/api/admin/products/import-csv")
        foreach ($p in $csvPaths) {
            $targets += @{
                Path = $p
                Field = "file"
                Role = "admin"
                ContentType = "text/csv"
                IsCsv = $true
            }
        }
    }

    return $targets
}

function Test-MaliciousFilenameBlocked {
    param(
        [string]$MaliciousName,
        [hashtable]$UploadResult,
        [string[]]$UploadDirs
    )

    $content = $UploadResult.Content
    $status = $UploadResult.StatusCode
    $escaped = [regex]::Escape($MaliciousName)
    $baseName = [System.IO.Path]::GetFileName($MaliciousName.Replace("/", "\"))

    if ($status -ge 400) {
        return @{ Pass = $true; Reason = "rejected HTTP $status" }
    }

    if ($content -match "\.\./|\.\.\\|$escaped|$([regex]::Escape($baseName))") {
        return @{ Pass = $false; Reason = "response reflects malicious filename" }
    }

    foreach ($dir in $UploadDirs) {
        if (-not (Test-Path $dir)) { continue }
        $hits = Get-ChildItem -Path $dir -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Name -match "\.\.|$([regex]::Escape($baseName))|%00|\.php\.|\.aspx"
            }
        if ($hits) {
            return @{ Pass = $false; Reason = "malicious filename on disk: $($hits[0].FullName)" }
        }
    }

    return @{ Pass = $true; Reason = "HTTP $status; sanitized or ignored client filename" }
}

function Get-AppUploadDirs {
    param([string]$AppRoot)

    $candidates = @(
        "public\uploads",
        "public\uploads\avatars",
        "public\uploads\reviews",
        "uploads",
        "tmp",
        "temp",
        "imports",
        ".cache"
    )

    $dirs = @()
    foreach ($rel in $candidates) {
        $full = Join-Path $AppRoot $rel
        if (Test-Path $full) { $dirs += $full }
    }
    return ($dirs | Select-Object -Unique)
}

function Get-SuspectTempFiles {
    param([string]$AppRoot)

    $skipDir = '(\\|/)(node_modules|\.git|dist|\.next|\.astro|samples|\.venv|venv)(\\|/)'
    $patterns = @("*.csv", "*.tmp", "*.part", "*.temp")
    $files = @()

    function Search-Dir {
        param([string]$Dir)
        foreach ($pattern in $patterns) {
            $script:files += Get-ChildItem -Path $Dir -File -Filter $pattern -ErrorAction SilentlyContinue
        }
        $script:files += Get-ChildItem -Path $Dir -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match "^(temp|tmp|partial|upload\.part)" }
        Get-ChildItem -Path $Dir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch $skipDir) { Search-Dir $_.FullName }
        }
    }

    $roots = @(
        (Join-Path $AppRoot "backend\uploads"),
        (Join-Path $AppRoot "uploads"),
        (Join-Path $AppRoot "tmp"),
        (Join-Path $AppRoot "temp")
    ) | Where-Object { Test-Path $_ }

    foreach ($root in $roots) { Search-Dir $root }
    return ($files | Select-Object FullName, Length, LastWriteTime -Unique)
}

function Get-FirstOrderId {
    param(
        [string]$ApiUrl,
        [string]$CookieJarPath
    )

    $curl = Get-CurlExe
    $raw = & $curl -s --max-time 30 -b $CookieJarPath "$ApiUrl/api/orders"
    if (-not $raw) { return $null }
    try {
        $json = $raw | ConvertFrom-Json
        if ($json.orders) {
            $order = $json.orders | Select-Object -First 1
            if ($order.id) { return [int]$order.id }
        }
    }
    catch { }
    return $null
}
