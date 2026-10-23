# SILKX — скачать реальные 360°-фото интерьеров (Poly Haven, CC0) для демо-тура и ужать их для сайта.
# Запуск из корня проекта:  powershell -ExecutionPolicy Bypass -File scripts\get-demo-tours.ps1
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot "..\public\tours\real"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$files = [ordered]@{
  "living"  = "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/cayley_interior.jpg"
  "bedroom" = "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/cabin.jpg"
  "kitchen" = "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/blinds.jpg"
}

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]84)

foreach ($name in $files.Keys) {
  $tmp = Join-Path $env:TEMP "silkx-$name-src.jpg"
  Write-Host "Скачиваю $name ..."
  Invoke-WebRequest -Uri $files[$name] -OutFile $tmp -UseBasicParsing

  # Ужимаем до 4096x2048 (2:1) — чётко на экране и ~1 МБ вместо ~5 МБ
  $src = [System.Drawing.Image]::FromFile($tmp)
  $w = [Math]::Min(4096, $src.Width); $h = [int]($w / 2)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $w, $h)
  $dest = Join-Path $out "$name.jpg"
  $bmp.Save($dest, $jpeg, $params)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose(); Remove-Item $tmp
  "{0}: {1}x{2}, {3:N0} KB" -f $name, $w, $h, ((Get-Item $dest).Length / 1KB) | Write-Host
}
Write-Host "Готово: public\tours\real. Перезапустите npm run dev и откройте 3D-тур."
