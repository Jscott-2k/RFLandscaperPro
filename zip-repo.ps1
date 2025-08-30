# Run from the repo root
param(
  [string[]] $ExcludeDirs  = @(".git","node_modules","dist","build"),
  [string[]] $ExcludeFiles = @(".env",".DS_Store","secrets.txt")
)

$ErrorActionPreference = "Stop"

# --- Paths
$RepoRoot = Convert-Path (Get-Location)
$RepoName = Split-Path $RepoRoot -Leaf
$TempCopy = Join-Path $env:TEMP "${RepoName}_copy"

# Timestamped zip name (avoids collisions)
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$ZipPath   = Join-Path $env:TEMP "${RepoName}_${Timestamp}.zip"

Write-Host "Preparing to zip repo: $RepoName"
Write-Host "Temp copy: $TempCopy"
Write-Host "Zip path : $ZipPath"
Write-Host ""

# --- Utils
function Normalize-PathUnix([string]$p) { ($p -replace '\\','/').TrimStart('./') }
function Rel-FromRoot([string]$full)    { Normalize-PathUnix ($full.Substring($RepoRoot.Length).TrimStart('\')) }

# Fast pre-exclusion (big/heavy dirs & obvious files)
function Test-IsPreExcluded($FullPath) {
  $norm = Normalize-PathUnix $FullPath
  foreach ($d in $ExcludeDirs) {
    if ($norm -match "/$([regex]::Escape($d))(/|$)" -or $norm.StartsWith("$($d)/")) { return $true }
  }
  $leaf = Split-Path $norm -Leaf
  foreach ($f in $ExcludeFiles) {
    if ($leaf -ieq $f) { return $true }
  }
  return $false
}

# --- GIT-Aware ignore
function Get-GitIgnoredSet($Files) {
  $set = New-Object 'System.Collections.Generic.HashSet[string]'
  $git = Get-Command git -ErrorAction SilentlyContinue
  if (-not $git) { return $null }

  $isRepo = & $git.Source -C $RepoRoot rev-parse --is-inside-work-tree 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $isRepo) { return $null }

  $relPaths = foreach ($f in $Files) { Rel-FromRoot $f.FullName }
  try {
    $output = $relPaths | & $git.Source -C $RepoRoot check-ignore --stdin 2>$null
    foreach ($line in $output) { $set.Add((Normalize-PathUnix $line)) | Out-Null }
  } catch { return $set }
  return $set
}

# --- Fallback .gitignore matcher
function New-GitignoreMatcher-Recursive {
  $giFiles = Get-ChildItem -Path $RepoRoot -Recurse -Force -File -Filter ".gitignore" -ErrorAction SilentlyContinue
  if (-not $giFiles -or $giFiles.Count -eq 0) {
    return { param($relPath) return $false }
  }
  $rules = New-Object System.Collections.Generic.List[object]
  foreach ($gi in $giFiles) {
    $baseDirFull = Split-Path $gi.FullName -Parent
    $baseRel     = Rel-FromRoot $baseDirFull
    if ($baseRel -eq "") { $baseRel = "" } else { $baseRel += "/" }
    $lines = Get-Content -LiteralPath $gi.FullName -ErrorAction SilentlyContinue
    foreach ($raw in $lines) {
      $line = $raw.Trim()
      if ($line -eq "" -or $line.StartsWith("#")) { continue }
      $negate = $false
      if ($line.StartsWith("!")) { $negate = $true; $line = $line.Substring(1) }
      $pattern = $line.Replace("\", "/")
      $pattern = $pattern.Replace("**","*")
      $isDir   = $pattern.EndsWith("/")
      if ($isDir) { $pattern = $pattern.TrimEnd("/") }
      $anchored = $pattern.StartsWith("/")
      if ($anchored) { $pattern = $pattern.TrimStart("/") }
      $wildRel = $baseRel + $pattern
      $wc = $wildRel
      $wcAnywhere = $null
      if ($wc -notlike "*/*") { $wcAnywhere = "*/*$wc" }
      $rules.Add([pscustomobject]@{
        Negate   = $negate
        IsDir    = $isDir
        Anchored = $anchored
        Wildcard = $wc
        AnyWhere = $wcAnywhere
      })
    }
  }
  return {
    param($relPath)
    $rel = Normalize-PathUnix $relPath
    $include = $true
    foreach ($r in $rules) {
      $match = $false
      if ($r.IsDir) {
        if ($rel -like ($r.Wildcard.TrimEnd('/') + "/*")) { $match = $true }
      } else {
        if ($rel -like $r.Wildcard -or ($null -ne $r.AnyWhere -and $rel -like $r.AnyWhere)) { $match = $true }
      }
      if ($match) { $include = if ($r.Negate) { $true } else { $false } }
    }
    return (-not $include)
  }
}

# --- Prep
if (Test-Path $TempCopy) { Remove-Item $TempCopy -Recurse -Force }
if (Test-Path $ZipPath)  { Remove-Item $ZipPath -Force }

Write-Host "Scanning files..."
$allFiles = Get-ChildItem -Path $RepoRoot -Recurse -Force -File
$allFiles = $allFiles | Where-Object { -not (Test-IsPreExcluded $_.FullName) }

$gitIgnoredSet = Get-GitIgnoredSet -Files $allFiles
$fallbackIgnore = { param($rel) return $false }
if ($null -eq $gitIgnoredSet) { $fallbackIgnore = New-GitignoreMatcher-Recursive }

$filtered = @()
foreach ($f in $allFiles) {
  $rel = Rel-FromRoot $f.FullName
  $ignoredByGit = ($gitIgnoredSet -and $gitIgnoredSet.Contains($rel))
  $ignoredByFallback = (& $fallbackIgnore $rel)
  if (-not ($ignoredByGit -or $ignoredByFallback)) { $filtered += $f }
}

if (-not $filtered -or $filtered.Count -eq 0) {
  Write-Warning "No files to process after applying exclusions and .gitignore."
  exit 0
}

$totalBytes = ($filtered | Measure-Object Length -Sum).Sum
if (-not $totalBytes) { $totalBytes = 1 }

# --- PHASE 1: Copy with progress
Write-Host "Copying to temp with progress..."
$bytesCopied = 0L
$filesCopied = 0
foreach ($src in $filtered) {
  $relPath = (Resolve-Path $src.FullName).Path.Substring($RepoRoot.Length).TrimStart('\')
  $dest    = Join-Path $TempCopy $relPath
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
  Copy-Item -LiteralPath $src.FullName -Destination $dest -Force
  $bytesCopied += $src.Length
  $filesCopied++
  $pct = [int]([double]$bytesCopied / [double]$totalBytes * 100)
  $status = "{0}/{1} files  ({2:P1})" -f $filesCopied, $filtered.Count, ($bytesCopied / $totalBytes)
  Write-Progress -Id 1 -Activity "Copying repo (respecting .gitignore)" -Status $status -PercentComplete $pct
}
Write-Progress -Id 1 -Activity "Copying repo (respecting .gitignore)" -Completed

# --- PHASE 2: Zip with progress
Write-Host "Zipping with progress..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$bytesZipped = 0L
$filesZipped = 0
$zipDir = Split-Path $ZipPath -Parent
if (-not (Test-Path $zipDir)) { New-Item -ItemType Directory -Path $zipDir | Out-Null }

$tempFiles = Get-ChildItem -Path $TempCopy -Recurse -Force -File
$totalZipBytes = ($tempFiles | Measure-Object Length -Sum).Sum
if (-not $totalZipBytes) { $totalZipBytes = 1 }

$zipStream = [System.IO.File]::Open($ZipPath, [System.IO.FileMode]::Create)
try {
  $zip = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
  foreach ($f in $tempFiles) {
    $entryPath = ($f.FullName.Substring($TempCopy.Length)).TrimStart('\')
    $entry = $zip.CreateEntry($entryPath, [System.IO.Compression.CompressionLevel]::Optimal)
    $inStream  = [System.IO.File]::OpenRead($f.FullName)
    try {
      $outStream = $entry.Open()
      try {
        $buffer = New-Object byte[] (1024*256)
        while (($read = $inStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
          $outStream.Write($buffer, 0, $read)
          $bytesZipped += $read
          $pct = [int]([double]$bytesZipped / [double]$totalZipBytes * 100)
          $status = "{0}/{1} files  ({2:P1})" -f $filesZipped, $tempFiles.Count, ($bytesZipped / $totalZipBytes)
          Write-Progress -Id 2 -Activity "Creating ZIP" -Status $status -PercentComplete $pct
        }
      } finally { $outStream.Dispose() }
    } finally { $inStream.Dispose() }
    $filesZipped++
  }
} finally {
  if ($zip) { $zip.Dispose() }
  $zipStream.Dispose()
}
Write-Progress -Id 2 -Activity "Creating ZIP" -Completed

# --- PHASE 3: Cleanup & reveal
if (Test-Path $TempCopy) {
  Write-Host "Cleaning up temp copy..."
  Remove-Item $TempCopy -Recurse -Force
}

Write-Host "Repo zipped successfully: $ZipPath"
Start-Process explorer.exe "/select,`"$ZipPath`""
