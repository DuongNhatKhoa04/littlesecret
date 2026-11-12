# phone-upload.ps1 — Nhận ảnh từ iPhone/iPad qua mạng LAN rồi chuyển cho Ticket Writer.
# iPhone mở http://<IP máy này>:<port>/<mã> bằng Safari để gửi ảnh.
# Ticket Writer hỏi http://127.0.0.1:<port>/<mã>/next để lấy từng ảnh (lấy xong là xóa khỏi hàng chờ).
# Ảnh chỉ giữ trong bộ nhớ: tắt cửa sổ là xóa, ảnh gốc vẫn còn trên iPhone.
# Chạy bằng phone-upload.bat. Chỉ dùng PowerShell có sẵn của Windows, không cần cài gì.
# -LocalOnly: chỉ nghe 127.0.0.1 (để test tự động, không bật hộp hỏi Tường lửa Windows)
param([int]$Port = 8765, [switch]$LocalOnly)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$MaxBytes = 50MB            # 1 ảnh tối đa
$MaxHeaderBytes = 16KB
$TimeoutMs = 15000          # client treo giữa chừng thì bỏ, không chặn người khác
$TokenAlphabet = 'abcdefghijkmnpqrstuvwxyz23456789'   # 32 ký tự, bỏ chữ dễ nhầm (l, o, 0, 1) khi gõ trên iPhone
$TokenLength = 12
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
# Mã lưu theo tài khoản Windows, NGOÀI folder dự án: nén folder gửi đồng nghiệp không mang mã theo,
# nên mỗi máy luôn có mã riêng (dùng chung mã thì người biết IP có thể gửi / lấy ảnh của máy khác).
$TokenFile = Join-Path $env:LOCALAPPDATA 'TicketWriter\phone-upload-token.txt'
$LegacyTokenFile = Join-Path $Here 'token.txt'   # bản đầu lưu mã trong folder dự án
$PageFile = Join-Path $Here 'upload.html'

# Mã bí mật trong link: máy khác trong LAN không biết mã thì không gửi / lấy ảnh được.
# Lưu lại để link đã lưu trên iPhone và Ticket Writer dùng được cho các lần chạy sau.
function Read-Token($path) {
  if (-not (Test-Path $path)) { return $null }
  $saved = (Get-Content $path -Raw).Trim()
  if ($saved -match "^[a-z0-9]{$TokenLength}$") { return $saved }
  return $null
}

function Save-Token($token) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $TokenFile) | Out-Null
  Set-Content -Path $TokenFile -Value $token -NoNewline -Encoding ASCII
}

function Get-Token {
  $saved = Read-Token $TokenFile
  if ($saved) { return $saved }
  # Chuyển mã cũ trong folder dự án sang chỗ mới: link đã lưu trên iPhone / Ticket Writer vẫn dùng được
  $legacy = Read-Token $LegacyTokenFile
  if ($legacy) {
    Save-Token $legacy
    Remove-Item $LegacyTokenFile -Force
    return $legacy
  }
  $bytes = New-Object byte[] $TokenLength
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $token = -join ($bytes | ForEach-Object { $TokenAlphabet[$_ % $TokenAlphabet.Length] })
  Save-Token $token
  return $token
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

function Receive-Image($stream, $request) {
  $type = [string]$request.Headers['content-type']
  if ($type -notmatch '^image/[a-z0-9.+-]+$') { Send-Json $stream 415 'Unsupported Media Type' '{"error":"Chỉ nhận file ảnh"}'; return }
  if ($request.Length -gt $MaxBytes) { Send-Json $stream 413 'Payload Too Large' '{"error":"Ảnh quá lớn (tối đa 50 MB)"}'; return }
  if (-not $request.Body) { Send-Json $stream 400 'Bad Request' '{"error":"Không đọc được ảnh"}'; return }
  # Tên file iPhone gửi đã encodeURIComponent: chỉ giữ ký tự an toàn để trả lại nguyên trong header
  $name = [string]$request.Headers['x-file-name'] -replace '[^A-Za-z0-9%._~-]', ''
  if (-not $name) { $name = 'iphone.' + $type.Split('/')[1] }
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

function Invoke-Request($stream) {
  $request = Read-Request $stream
  if (-not $request) { return }
  if ($request.Method -eq 'OPTIONS') { Send-Response $stream 204 'No Content'; return }
  $base = "/$Token"
  switch ("$($request.Method) $($request.Path)") {
    "GET $base"          { Send-Response $stream 200 'OK' @{ 'Content-Type' = 'text/html; charset=utf-8' } $Page }
    "GET $base/"         { Send-Response $stream 200 'OK' @{ 'Content-Type' = 'text/html; charset=utf-8' } $Page }
    "POST $base/upload"  { Receive-Image $stream $request }
    "GET $base/next"     { Send-Next $stream }
    default              { Send-Response $stream 404 'Not Found' }   # sai mã: không cho biết gì thêm
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

$Token = Get-Token
$Page = [IO.File]::ReadAllBytes($PageFile)
$Queue = New-Object System.Collections.Generic.Queue[object]
$Listener = New-Object Net.Sockets.TcpListener($(if ($LocalOnly) { [Net.IPAddress]::Loopback } else { [Net.IPAddress]::Any }), $Port)
try { $Listener.Start() } catch {
  Write-Host "Không mở được port $Port. Có thể phone-upload đang chạy ở cửa sổ khác." -ForegroundColor Red
  exit 1
}

$addresses = @(Get-LanAddresses)
Write-Host ''
Write-Host '=== Nhận ảnh iPhone / iPad cho Ticket Writer ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Trên iPhone / iPad (cùng Wi-Fi với máy này), mở bằng Safari:'
foreach ($address in $addresses) { Write-Host "    http://${address}:$Port/$Token" -ForegroundColor Yellow }
if (-not $addresses.Count) { Write-Host '    (Không thấy mạng LAN nào. Kiểm tra Wi-Fi / dây mạng.)' -ForegroundColor Red }
Write-Host ''
$localLink = "http://127.0.0.1:$Port/$Token"
$copied = ''
if (-not $LocalOnly) { try { Set-Clipboard -Value $localLink; $copied = ' (đã copy sẵn, chỉ cần Ctrl+V)' } catch { } }
Write-Host "Ticket Writer: bấm nút 📱 rồi dán link $localLink$copied"
Write-Host ''
Write-Host 'Giữ cửa sổ này mở trong lúc làm. Tắt cửa sổ = ngừng nhận ảnh.' -ForegroundColor DarkGray
Write-Host ''

try {
  while ($true) {
    # Hỏi Pending() thay vì chờ chặn để Ctrl+C trên cửa sổ vẫn dừng được ngay
    while (-not $Listener.Pending()) { Start-Sleep -Milliseconds 50 }
    $client = $Listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = $TimeoutMs
      $client.SendTimeout = $TimeoutMs
      Invoke-Request $client.GetStream()
    } catch {
      Write-Host "Bỏ qua 1 kết nối lỗi: $($_.Exception.Message)" -ForegroundColor DarkGray
    } finally { $client.Close() }
  }
} finally { $Listener.Stop() }
