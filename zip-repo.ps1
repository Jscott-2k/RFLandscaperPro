# Ensure we’re running from the repo root
$RepoRoot = Get-Location
$RepoName = Split-Path $RepoRoot -Leaf
$ParentDir = Split-Path $RepoRoot -Parent
$TempCopy = Join-Path $ParentDir "${RepoName}_copy"
$ZipPath  = Join-Path $ParentDir "${RepoName}.zip"

Write-Host "📦 Preparing to zip repo: $RepoName"
Write-Host "➡️  Output: $ZipPath"

# 1. Remove old artifacts if they exist
if (Test-Path $TempCopy) {
    Remove-Item $TempCopy -Recurse -Force
}
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# 2. Copy repo into a temporary folder
Copy-Item $RepoRoot $TempCopy -Recurse

# 3. Remove unwanted folders/files from the copy
$ExcludePaths = @("node_modules", "dist", "build", ".env", ".DS_Store")
foreach ($path in $ExcludePaths) {
    $Target = Join-Path $TempCopy $path
    if (Test-Path $Target) {
        Write-Host "🧹 Removing $path"
        Remove-Item $Target -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 4. Create the zip
Compress-Archive -Path $TempCopy\* -DestinationPath $ZipPath

# 5. Clean up the temp copy
Remove-Item $TempCopy -Recurse -Force

Write-Host "✅ Repo zipped successfully: $ZipPath"
