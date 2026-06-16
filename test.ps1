$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "Creating User..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/signup" -Method Post -Body '{"name":"Alice","email":"alice@test.com","password":"testpassword"}' -ContentType "application/json" -WebSession $session
} catch {
    Write-Host $_.Exception.Response.StatusCode.Value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}

Write-Host "Testing Duplicate Email..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/signup" -Method Post -Body '{"name":"Bob","email":"alice@test.com","password":"123"}' -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}

Write-Host "Testing Invalid Login..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method Post -Body '{"email":"alice@test.com","password":"wrong"}' -ContentType "application/json" -WebSession $session
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}

Write-Host "Testing Forgot Password..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/forgot-password" -Method Post -Body '{"email":"alice@test.com","newPassword":"newpass"}' -ContentType "application/json"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}

Write-Host "Testing Login with New Password..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method Post -Body '{"email":"alice@test.com","password":"newpass"}' -ContentType "application/json" -WebSession $session
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}
