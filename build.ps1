param (
    [string]$Version = "1.0.0"
)

# Define variables
$extensionName = "sharepoint-video-catcher"
$outputFileName = "$extensionName-v$Version.zip"
$sourceDir = Get-Location
$outputDir = Join-Path $sourceDir "dist"

# Create output directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Clean up previous zip if it exists
$outputPath = Join-Path $outputDir $outputFileName
if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
}

# Define files to include
$filesToInclude = @(
    "background.js",
    "manifest.json",
    "popup.css",
    "popup.html",
    "popup.js",
    "options.css",
    "options.html",
    "options.js",
    "README.md",
    "icons/*"
)

# Create a temporary directory
$tempDir = Join-Path $env:TEMP "$extensionName-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files to the temporary directory
foreach ($filePattern in $filesToInclude) {
    if ($filePattern -like "*/*") {
        # Handle directories with wildcards
        $dirName = $filePattern.Substring(0, $filePattern.IndexOf("/"))
        $dirPath = Join-Path $tempDir $dirName
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath | Out-Null
        }
    }
    
    $files = Get-ChildItem -Path $filePattern
    foreach ($file in $files) {
        $destPath = if ($file.PSIsContainer) {
            # It's a directory
            $targetDir = Join-Path $tempDir $file.Name
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir | Out-Null
            }
            $null
        } else {
            # It's a file
            if ($file.Directory.Name -ne (Get-Item $sourceDir).Name) {
                # File is in a subdirectory
                $targetDir = Join-Path $tempDir $file.Directory.Name
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir | Out-Null
                }
                Join-Path $targetDir $file.Name
            } else {
                # File is in the root directory
                Join-Path $tempDir $file.Name
            }
        }
        
        if ($destPath) {
            Copy-Item $file.FullName -Destination $destPath -Force
        }
    }
}

# Create zip file
Add-Type -Assembly System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $outputPath)

# Clean up temporary directory
Remove-Item $tempDir -Recurse -Force

Write-Host "Extension packaged successfully: $outputPath"
