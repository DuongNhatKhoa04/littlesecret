# phone-upload.ps1 — Nhận ảnh từ iPad / iPhone qua mạng LAN rồi chuyển cho Ticket Writer.
# 2 mã bí mật:
#   - Mã máy tính (cố định): Ticket Writer gọi http://127.0.0.1:<port>/<mã máy tính>/... — chỉ nhận từ chính máy này.
#   - Mã iPad (tự đổi sau 12 tiếng): iPad quét QR trên Ticket Writer, mở http://<IP LAN>:<port>/u/<mã iPad>.
#     iPad dùng chung nhiều người: mã hết hạn / bấm "Đổi mã ngay" thì tab cũ trên iPad không gửi được nữa.
# Ảnh chỉ giữ trong bộ nhớ: tắt cửa sổ là xóa, ảnh gốc vẫn còn trên iPad.
# Chạy bằng phone-upload.bat. Chỉ dùng PowerShell có sẵn của Windows, không cần cài gì.
# -LocalOnly: chỉ nghe 127.0.0.1 (để test tự động, không bật hộp hỏi Tường lửa Windows)
param([int]$Port = 8765, [switch]$LocalOnly)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$MaxBytes = 50MB            # 1 ảnh tối đa
$MaxHeaderBytes = 16KB
$TimeoutMs = 15000          # client treo giữa chừng thì bỏ, không chặn người khác
$SessionHours = 12          # mã iPad hết hạn sau bấy nhiêu giờ
$CodeAlphabet = 'abcdefghijkmnpqrstuvwxyz23456789'   # 32 ký tự, bỏ chữ dễ nhầm (l, o, 0, 1)
$CodeLength = 12
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
# Mã lưu theo tài khoản Windows, NGOÀI folder dự án: nén folder gửi đồng nghiệp không mang mã theo
$DataDir = Join-Path $env:LOCALAPPDATA 'TicketWriter'
$DeskFile = Join-Path $DataDir 'phone-upload-token.txt'
$SessionFile = Join-Path $DataDir 'phone-upload-session.txt'   # "<mã iPad> <giờ hết hạn, giây Unix>"
$LegacyDeskFile = Join-Path $Here 'token.txt'                  # bản đầu lưu mã trong folder dự án
$PageFile = Join-Path $Here 'upload.html'

function New-Code {
  $bytes = New-Object byte[] $CodeLength
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  -join ($bytes | ForEach-Object { $CodeAlphabet[$_ % $CodeAlphabet.Length] })
}

function Read-Code($path) {
  if (-not (Test-Path $path)) { return $null }
  $saved = (Get-Content $path -Raw).Trim()
  if ($saved -match "^[a-z0-9]{$CodeLength}( \d+)?$") { return $saved }
  return $null
}

function Save-Text($path, $text) {
  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
  Set-Content -Path $path -Value $text -NoNewline -Encoding ASCII
}

# Mã máy tính: cố định để Ticket Writer chỉ dán link 1 lần
function Get-DeskToken {
  $saved = Read-Code $DeskFile
  if ($saved) { return $saved }
  $token = Read-Code $LegacyDeskFile   # chuyển mã cũ sang chỗ mới: link đã dán trong Ticket Writer vẫn dùng được
  if ($token) { Remove-Item $LegacyDeskFile -Force } else { $token = New-Code }
  Save-Text $DeskFile $token
  return $token
}

# Mã iPad: lưu lại để tắt / mở lại cửa sổ trong 12 tiếng thì iPad không phải quét lại
function Get-Session([switch]$Renew) {
  $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $saved = Read-Code $SessionFile
  if (-not $Renew -and $saved -and $saved.Contains(' ')) {
    $code, $expires = $saved.Split(' ')
    if ([long]$expires -gt $now) { return @{ Code = $code; Expires = [long]$expires } }
  }
  $session = @{ Code = (New-Code); Expires = $now + $SessionHours * 3600 }
  Save-Text $SessionFile "$($session.Code) $($session.Expires)"
  Write-Host ('{0:HH:mm:ss}  Mã iPad mới, hết hạn lúc {1:HH:mm dd/MM}. iPad quét lại QR trên Ticket Writer.' -f (Get-Date), [DateTimeOffset]::FromUnixTimeSeconds($session.Expires).LocalDateTime) -ForegroundColor Cyan
  return $session
}

function Read-Exact($stream, [int]$length) {
  $buffer = New-Object byte[] $length
  $read = 0
  while ($read -lt $length) {
    $count = $stream.Read($buffer, $read, $length - $read)
    if ($count -le 0) { return $null }
    $read += $count
  }
  return ,$buffer
}

# Trả $null khi request hỏng / quá lớn. Body chỉ đọc khi nhỏ hơn MaxBytes.
function Read-Request($stream) {
  $head = New-Object System.Collections.Generic.List[byte]
  while ($head.Count -lt 4 -or -not ($head[$head.Count - 4] -eq 13 -and $head[$head.Count - 3] -eq 10 -and $head[$head.Count - 2] -eq 13 -and $head[$head.Count - 1] -eq 10)) {
    $byte = $stream.ReadByte()
    if ($byte -lt 0 -or $head.Count -ge $MaxHeaderBytes) { return $null }
    $head.Add([byte]$byte)
  }
  $lines = [Text.Encoding]::ASCII.GetString($head.ToArray()).Split("`r`n", [StringSplitOptions]::RemoveEmptyEntries)
  $parts = $lines[0].Split(' ')
  if ($parts.Length -lt 2) { return $null }
  $headers = @{}
  foreach ($line in ($lines | Select-Object -Skip 1)) {
    $at = $line.IndexOf(':')
    if ($at -gt 0) { $headers[$line.Substring(0, $at).Trim().ToLower()] = $line.Substring($at + 1).Trim() }
  }
  $length = 0
  if ($headers['content-length']) { $length = [long]$headers['content-length'] }
  $request = @{ Method = $parts[0]; Path = $parts[1].Split('?')[0]; Headers = $headers; Length = $length; Body = $null }
  if ($length -gt 0 -and $length -le $MaxBytes) { $request.Body = Read-Exact $stream ([int]$length) }
  return $request
}

function Send-Response($stream, [int]$status, [string]$reason, [hashtable]$headers = @{}, [byte[]]$body = [byte[]]@()) {
  # Ticket Writer chạy file:// nên phải cho phép CORS; an toàn vì mọi đường dẫn đều cần mã bí mật
  $lines = @(
    "HTTP/1.1 $status $reason", 'Connection: close', 'Cache-Control: no-store',
    'Access-Control-Allow-Origin: *', 'Access-Control-Allow-Private-Network: true',
    'Access-Control-Allow-Headers: Content-Type, X-File-Name', 'Access-Control-Expose-Headers: X-File-Name',
    "Content-Length: $($body.Length)"
  )
  foreach ($key in $headers.Keys) { $lines += "${key}: $($headers[$key])" }
  $headBytes = [Text.Encoding]::ASCII.GetBytes(($lines -join "`r`n") + "`r`n`r`n")
  $stream.Write($headBytes, 0, $headBytes.Length)
  if ($body.Length) { $stream.Write($body, 0, $body.Length) }
}

function Send-Json($stream, [int]$status, [string]$reason, [string]$json) {
  Send-Response $stream $status $reason @{ 'Content-Type' = 'application/json' } ([Text.Encoding]::UTF8.GetBytes($json))
}

function Send-Expired($stream) { Send-Json $stream 410 'Gone' '{"error":"Mã đã hết hạn. Quét lại mã QR trên Ticket Writer."}' }

function Receive-Image($stream, $request) {
  $type = [string]$request.Headers['content-type']
  if ($type -notmatch '^image/[a-z0-9.+-]+$') { Send-Json $stream 415 'Unsupported Media Type' '{"error":"Chỉ nhận file ảnh"}'; return }
  if ($request.Length -gt $MaxBytes) { Send-Json $stream 413 'Payload Too Large' '{"error":"Ảnh quá lớn (tối đa 50 MB)"}'; return }
  if (-not $request.Body) { Send-Json $stream 400 'Bad Request' '{"error":"Không đọc được ảnh"}'; return }
  # Tên file iPad gửi đã encodeURIComponent: chỉ giữ ký tự an toàn để trả lại nguyên trong header
  $name = [string]$request.Headers['x-file-name'] -replace '[^A-Za-z0-9%._~-]', ''
  if (-not $name) { $name = 'ios.' + $type.Split('/')[1] }
  $Queue.Enqueue(@{ Name = $name; Type = $type; Bytes = $request.Body })
  Write-Host ('{0:HH:mm:ss}  Nhận {1} ({2:N1} MB) — chờ Ticket Writer lấy: {3}' -f (Get-Date), [Uri]::UnescapeDataString($name), ($request.Length / 1MB), $Queue.Count)
  Send-Json $stream 200 'OK' "{`"waiting`":$($Queue.Count)}"
}

function Send-Next($stream) {
  if ($Queue.Count -eq 0) { Send-Response $stream 204 'No Content'; return }
  $image = $Queue.Dequeue()
  Send-Response $stream 200 'OK' @{ 'Content-Type' = $image.Type; 'X-File-Name' = $image.Name } $image.Bytes
  Write-Host ('{0:HH:mm:ss}  Ticket Writer đã lấy {1}' -f (Get-Date), [Uri]::UnescapeDataString($image.Name))
}

# Link cho iPad (Ticket Writer vẽ thành QR) + giờ hết hạn (ISO UTC)
function Send-Info($stream, $session) {
  $urls = ($Addresses | ForEach-Object { "`"http://${_}:$Port/u/$($session.Code)`"" }) -join ','
  $expires = [DateTimeOffset]::FromUnixTimeSeconds($session.Expires).UtcDateTime.ToString('yyyy-MM-ddTHH:mm:ssZ')
  Send-Json $stream 200 'OK' "{`"urls`":[$urls],`"expiresAt`":`"$expires`"}"
}

# Mã máy tính: chỉ nhận từ chính máy này (iPad / máy khác trong LAN biết mã cũng không lấy được ảnh)
function Invoke-DeskRequest($stream, $route) {
  switch ($route) {
    'GET next'     { Send-Next $stream }
    'GET info'     { Send-Info $stream (Get-Session) }
    'POST rotate'  { Send-Info $stream (Get-Session -Renew) }
    default        { Send-Response $stream 404 'Not Found' }
  }
}

function Invoke-IpadRequest($stream, $request, $code, $action) {
  if ($request.Method -eq 'GET' -and -not $action) {   # trang luôn mở được; trang tự hỏi /check để báo hết hạn
    Send-Response $stream 200 'OK' @{ 'Content-Type' = 'text/html; charset=utf-8' } $Page
    return
  }
  $session = Get-Session
  if ($code -cne $session.Code) { Send-Expired $stream; return }
  switch ("$($request.Method) $action") {
    'GET check'    { Send-Json $stream 200 'OK' '{}' }
    'POST upload'  { Receive-Image $stream $request }
    default        { Send-Response $stream 404 'Not Found' }
  }
}

function Invoke-Request($stream, [bool]$isLocal) {
  $request = Read-Request $stream
  if (-not $request) { return }
  if ($request.Method -eq 'OPTIONS') { Send-Response $stream 204 'No Content'; return }
  if ($request.Path -match '^/u/([a-z0-9]+)/?(check|upload)?$') {
    Invoke-IpadRequest $stream $request $Matches[1] $Matches[2]
  } elseif ($isLocal -and $request.Path -match "^/$DeskToken/(next|info|rotate)$") {
    Invoke-DeskRequest $stream "$($request.Method) $($Matches[1])"
  } else {
    Send-Response $stream 404 'Not Found'   # sai mã / không phải từ máy này: không cho biết gì thêm
  }
}

# Ưu tiên card mạng có default gateway (Wi-Fi / LAN thật); card ảo của VMware / WSL / Hyper-V không có gateway
function Get-LanAddresses {
  try {
    $real = @(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | ForEach-Object { $_.IPv4Address.IPAddress })
    if ($real.Count) { return $real }
  } catch { }
  [Net.Dns]::GetHostAddresses([Net.Dns]::GetHostName()) |
    Where-Object { $_.AddressFamily -eq 'InterNetwork' -and -not $_.ToString().StartsWith('169.254.') } |
    ForEach-Object { $_.ToString() }
}

$DeskToken = Get-DeskToken
$Page = [IO.File]::ReadAllBytes($PageFile)
$Queue = New-Object System.Collections.Generic.Queue[object]
$Addresses = @(Get-LanAddresses)
$Listener = New-Object Net.Sockets.TcpListener($(if ($LocalOnly) { [Net.IPAddress]::Loopback } else { [Net.IPAddress]::Any }), $Port)
try { $Listener.Start() } catch {
  Write-Host "Không mở được port $Port. Có thể phone-upload đang chạy ở cửa sổ khác." -ForegroundColor Red
  exit 1
}

$deskLink = "http://127.0.0.1:$Port/$DeskToken"
$copied = ''
if (-not $LocalOnly) { try { Set-Clipboard -Value $deskLink; $copied = ' (đã copy sẵn, chỉ cần Ctrl+V)' } catch { } }
Write-Host ''
Write-Host '=== Nhận ảnh iOS cho Ticket Writer ===' -ForegroundColor Cyan
Write-Host ''
Write-Host '1. Ticket Writer trên MÁY NÀY (chỉ làm 1 lần): bấm nút Nhận ảnh iOS, dán link:'
Write-Host "     $deskLink$copied" -ForegroundColor Yellow
Write-Host '   Link này chỉ dùng trên máy này, KHÔNG mở trên iPad.' -ForegroundColor DarkGray
Write-Host ''
Write-Host '2. iPad / iPhone (cùng Wi-Fi): bấm nút Nhận ảnh iOS trên Ticket Writer -> quét mã QR bằng camera.'
Write-Host "   Mã iPad tự đổi sau $SessionHours tiếng; đổi ca thì bấm Đổi mã ngay." -ForegroundColor DarkGray
if (-not $Addresses.Count) { Write-Host '   (Không thấy mạng LAN nào. Kiểm tra Wi-Fi / dây mạng.)' -ForegroundColor Red }
Write-Host ''
Write-Host 'Giữ cửa sổ này mở trong lúc làm. Tắt cửa sổ = ngừng nhận ảnh.' -ForegroundColor DarkGray
Write-Host ''

function Invoke-Client($client) {
  try {
    $client.ReceiveTimeout = $TimeoutMs
    $client.SendTimeout = $TimeoutMs
    Invoke-Request $client.GetStream() ([Net.IPAddress]::IsLoopback($client.Client.RemoteEndPoint.Address))
  } catch {
    Write-Host "Bỏ qua 1 kết nối lỗi: $($_.Exception.Message)" -ForegroundColor DarkGray
  } finally { $client.Close() }
}

# Xử lý 1 request 1 lúc nhưng KHÔNG chờ kết nối để không: Safari / Chrome hay mở sẵn kết nối dự phòng mà không gửi gì,
# chờ nó thì mọi request khác kẹt tới hết TimeoutMs. Chỉ xử lý kết nối đã có dữ liệu; để không quá TimeoutMs thì đóng.
$Waiting = New-Object System.Collections.Generic.List[object]
try {
  while ($true) {
    while ($Listener.Pending()) { $Waiting.Add(@{ Client = $Listener.AcceptTcpClient(); Since = [DateTime]::UtcNow }) }
    $now = [DateTime]::UtcNow
    $ready = @($Waiting | Where-Object { $_.Client.Available -gt 0 })
    $idle = @($Waiting | Where-Object { $_.Client.Available -eq 0 -and ($now - $_.Since).TotalMilliseconds -gt $TimeoutMs })
    foreach ($item in $ready + $idle) { [void]$Waiting.Remove($item) }
    foreach ($item in $idle) { $item.Client.Close() }
    foreach ($item in $ready) { Invoke-Client $item.Client }
    # Ngủ ngắn thay vì chờ chặn để Ctrl+C trên cửa sổ vẫn dừng được ngay
    if (-not $ready.Count) { Start-Sleep -Milliseconds 20 }
  }
} finally {
  foreach ($item in $Waiting) { $item.Client.Close() }
  $Listener.Stop()
}
