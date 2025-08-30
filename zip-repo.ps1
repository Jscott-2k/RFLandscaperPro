# Run from the repo root
param(
  [string[]] $ExcludeDirs = @(".git","node_modules","dist","build"),
  [string[]] $ExcludeFiles = @(".env",".DS_Store")
)

$ErrorActionPreference = "Stop"

$RepoRoot = Convert-Path (Get-Location)
$RepoName = Split-Path $RepoRoot -Leaf
$TempCopy = Join-Path $env:TEMP "${RepoName}_copy"
$ZipPath  = Join-Path $env:TEMP "${RepoName}.zip"

Write-Host "Preparing to zip repo: $RepoName"
Write-Host "Temp copy: $TempCopy"
Write-Host "Zip path : $ZipPath"
Write-Host ""

# Helpers
function Test-IsExcluded {
  param($FullPath)
  $norm = $FullPath -replace '\\','/'
  foreach ($d in $ExcludeDirs) {
    if ($norm -match "/$([regex]::Escape($d))(/|$)") { return $true }
  }
  $file = Split-Path $norm -Leaf
  foreach ($f in $ExcludeFiles) {
    if ($file -ieq $f) { return $true }
  }
  return $false
}

# Clean old artifacts
if (Test-Path $TempCopy) { Remove-Item $TempCopy -Recurse -Force }
if (Test-Path $ZipPath)  { Remove-Item $ZipPath -Force }

# Gather file list (from source repo) with exclusions
Write-Host "Scanning files..."
$allFiles = Get-ChildItem -Path $RepoRoot -Recurse -Force -File | Where-Object {
  -not (Test-IsExcluded $_.FullName)
}

if (-not $allFiles -or $allFiles.Count -eq 0) {
  Write-Warning "No files to process after applying exclusions."
  exit 0
}

$totalBytes = ($allFiles | Measure-Object Length -Sum).Sum
if (-not $totalBytes) { $totalBytes = 1 } # avoid div by zero

# PHASE 1: Copy with progress
Write-Host "Copying to temp with progress..."
$bytesCopied = 0L
$filesCopied = 0
foreach ($src in $allFiles) {
  $relPath = Resolve-Path $src.FullName | ForEach-Object { $_.Path.Substring($RepoRoot.Length).TrimStart('\') }
  $dest    = Join-Path $TempCopy $relPath

  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
  }

  Copy-Item -LiteralPath $src.FullName -Destination $dest -Force
  $bytesCopied += $src.Length
  $filesCopied++

  $pct = [int]([double]$bytesCopied / [double]$totalBytes * 100)
  $status = "{0}/{1} files  ({2:P1})" -f $filesCopied, $allFiles.Count, ($bytesCopied / $totalBytes)
  Write-Progress -Id 1 -Activity "Copying repo (excluding junk)" -Status $status -PercentComplete $pct
}
Write-Progress -Id 1 -Activity "Copying repo (excluding junk)" -Completed

# PHASE 2: Zip with progress
Write-Host "Zipping with progress..."
Add-Type -AssemblyName System.IO.Compression.FileSystem

$bytesZipped = 0L
$filesZipped = 0

# Make sure target zip directory exists
$zipDir = Split-Path $ZipPath -Parent
if (-not (Test-Path $zipDir)) { New-Item -ItemType Directory -Path $zipDir | Out-Null }

# Build list again from temp (same files, new paths)
$tempFiles = Get-ChildItem -Path $TempCopy -Recurse -Force -File
$totalZipBytes = ($tempFiles | Measure-Object Length -Sum).Sum
if (-not $totalZipBytes) { $totalZipBytes = 1 }

# Create zip and add files one-by-one so we can report progress
$zipStream = [System.IO.File]::Open($ZipPath, [System.IO.FileMode]::Create)
try {
  $zip = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)

  foreach ($f in $tempFiles) {
    $entryPath = ($f.FullName.Substring($TempCopy.Length)).TrimStart('\')
    $entry = $zip.CreateEntry($entryPath, [System.IO.Compression.CompressionLevel]::Optimal)

    # Copy file content into the zip entry
    $inStream  = [System.IO.File]::OpenRead($f.FullName)
    try {
      $outStream = $entry.Open()
      try {
        $buffer = New-Object byte[] (1024*256) # 256KB chunks
        while (($read = $inStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
          $outStream.Write($buffer, 0, $read)
          $bytesZipped += $read
          $pct = [int]([double]$bytesZipped / [double]$totalZipBytes * 100)
          $status = "{0}/{1} files  ({2:P1})" -f $filesZipped, $tempFiles.Count, ($bytesZipped / $totalZipBytes)
          Write-Progress -Id 2 -Activity "Creating ZIP" -Status $status -PercentComplete $pct
        }
      } finally {
        $outStream.Dispose()
      }
    } finally {
      $inStream.Dispose()
    }

    $filesZipped++
  }
} finally {
  if ($zip) { $zip.Dispose() }
  $zipStream.Dispose()
}
Write-Progress -Id 2 -Activity "Creating ZIP" -Completed

# PHASE 3: Cleanup temp copy
if (Test-Path $TempCopy) {
  Write-Host "Cleaning up temp copy..."
  Remove-Item $TempCopy -Recurse -Force
}

Write-Host "Repo zipped successfully: $ZipPath"

# Open File Explorer to the zip
Start-Process explorer.exe "/select,`"$ZipPath`""
