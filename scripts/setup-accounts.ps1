$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot '../server/NotVarMi.Api/appsettings.Local.json'
if (Test-Path -LiteralPath $configPath) {
    throw 'Yerel hesap ayarı zaten var. Mevcut ayar korunuyor; değiştirmeden önce yedeğini alın.'
}

function Get-PasswordHash([string]$role) {
    $secret = Read-Host "$role hesabının şifresi" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try {
        $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        if ([string]::IsNullOrWhiteSpace($password)) { throw 'Şifre boş olamaz.' }
        $salt = [byte[]]::new(16)
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($salt)
        $key = [System.Security.Cryptography.Rfc2898DeriveBytes]::Pbkdf2($password, $salt, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA512, 32)
        $header = [byte[]](1,0,0,0,2,0,1,134,160,0,0,0,16)
        return [Convert]::ToBase64String($header + $salt + $key)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $password = $null
    }
}
$adminHash = Get-PasswordHash 'Yönetici'
$viewerHash = Get-PasswordHash 'Misafir'
$settings = @{ Accounts = @{ Admin = @{ PasswordHash = $adminHash }; Viewer = @{ PasswordHash = $viewerHash } } }
$json = $settings | ConvertTo-Json -Depth 5
$stream = [System.IO.File]::Open($configPath, [System.IO.FileMode]::CreateNew)
try {
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false))
    try { $writer.Write($json) } finally { $writer.Dispose() }
} finally { $stream.Dispose() }
Write-Host 'Yerel hesap ayarları oluşturuldu. Bu dosyayı paylaşmayın.'
