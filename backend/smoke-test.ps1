$body = '{"name":"Real SMS Test","email":"realsmstest@bharatbuddy.com","phone":"9876507777","password":"test123"}'
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 15 -UseBasicParsing
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output $r.Content
} catch {
    $resp = $_.Exception.Response
    if ($resp) {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        Write-Output "HTTP ERROR: $([int]$resp.StatusCode)"
        Write-Output ("BODY: " + $sr.ReadToEnd())
    } else {
        Write-Output ("ERROR: " + $_.Exception.Message)
    }
}
