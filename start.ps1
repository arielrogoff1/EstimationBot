# Spray Foam Estimator AI — Local Server
# Double-click this file to start the app

# Read API key — checks .env.local first, then .env
$apiKey = ""
foreach ($envFile in @(".env.local", ".env")) {
    $envPath = Join-Path $PSScriptRoot $envFile
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match "^ANTHROPIC_API_KEY=(.+)$" -and !$apiKey) { $apiKey = $matches[1].Trim() }
        }
    }
}

if (!$apiKey -or $apiKey -eq "sk-ant-your_key_here") {
    Write-Host ""
    Write-Host "  ERROR: No API key found." -ForegroundColor Red
    Write-Host "  Open .env and set ANTHROPIC_API_KEY=sk-ant-..." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3000/")

try { $listener.Start() }
catch {
    Write-Host "  Port 3000 is already in use. Close the other window and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "  Spray Foam Estimator AI" -ForegroundColor Cyan
Write-Host "  Running at http://localhost:3000" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop."
Write-Host ""
Start-Process "http://localhost:3000"

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        # --- Serve index.html ---
        if ($req.HttpMethod -eq "GET" -and $req.Url.LocalPath -match "^/(index\.html)?$") {
            $htmlPath = Join-Path $PSScriptRoot "public\index.html"
            $bytes = [System.IO.File]::ReadAllBytes($htmlPath)
            $res.ContentType = "text/html; charset=utf-8"
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        # --- Proxy /api/analyze → Anthropic ---
        elseif ($req.HttpMethod -eq "POST" -and $req.Url.LocalPath -eq "/api/analyze") {
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()

            $wc = New-Object System.Net.WebClient
            $wc.Encoding = [System.Text.Encoding]::UTF8
            $wc.Headers["Content-Type"]      = "application/json"
            $wc.Headers["x-api-key"]         = $apiKey
            $wc.Headers["anthropic-version"] = "2023-06-01"

            try {
                $response = $wc.UploadString("https://api.anthropic.com/v1/messages", "POST", $body)
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($response)
                $res.ContentType = "application/json"
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            catch [System.Net.WebException] {
                $errStream = $_.Exception.Response.GetResponseStream()
                $errReader = New-Object System.IO.StreamReader($errStream)
                $errBody = $errReader.ReadToEnd()
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($errBody)
                $res.StatusCode = [int]$_.Exception.Response.StatusCode
                $res.ContentType = "application/json"
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }

        else {
            $res.StatusCode = 404
        }

        $res.OutputStream.Close()
    }
    catch { <# swallow closed-connection noise #> }
}
