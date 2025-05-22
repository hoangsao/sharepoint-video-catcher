# Sharepoint Video Catcher - Build Script
# 
# This script packages the extension for distribution.
# It creates a zip file that can be uploaded to browser extension stores.
#
# Usage: 
#   .\build.ps1 -Version "1.0.0"
#
# @author Sharepoint Video Catcher Team
# @version 1.0.0
# @license MIT

param (
    [Parameter(Mandatory=$false, HelpMessage="Version number for the build (e.g. 1.0.0)")]
    [string]$Version = "1.0.0"
)

# Ensure version starts with 'v'
if (-not $Version.StartsWith("v", [System.StringComparison]::OrdinalIgnoreCase)) {
    $Version = "v" + $Version
}

# Define variables
$extensionName = "sharepoint-video-catcher"
$outputFileName = "$extensionName-$Version.zip"
$sourceDir = Get-Location
$outputDir = Join-Path $sourceDir "dist"
$tempDir = Join-Path $env:TEMP "$extensionName-temp"
$outputPath = Join-Path $outputDir $outputFileName

# Create output directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    Write-Host "Creating output directory: $outputDir"
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Clean up previous zip if it exists
if (Test-Path $outputPath) {
    Write-Host "Removing existing package: $outputPath"
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
    "logger.js",
    "logger-test.js",
    "README.md",
    "LOGGER.md",
    "icons/*"
)

# Create a temporary directory
if (Test-Path $tempDir) {
    Write-Host "Cleaning temporary directory: $tempDir"
    Remove-Item $tempDir -Recurse -Force
}
Write-Host "Creating temporary directory: $tempDir"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    # Copy files to the temporary directory
    Write-Host "Copying files to temporary directory..."
    foreach ($filePattern in $filesToInclude) {
        if ($filePattern -match "(.+)/\*$") {
            # Handle directory with wildcard (e.g., "icons/*")
            $dirName = $matches[1]
            $dirPath = Join-Path $tempDir $dirName
            
            if (-not (Test-Path $dirPath)) {
                New-Item -ItemType Directory -Path $dirPath | Out-Null
            }
            
            $sourceDirPath = Join-Path $sourceDir $dirName
            if (Test-Path $sourceDirPath) {
                Get-ChildItem -Path $sourceDirPath -Recurse | ForEach-Object {
                    $targetPath = $_.FullName.Replace($sourceDirPath, $dirPath)
                    
                    if ($_.PSIsContainer) {
                        if (-not (Test-Path $targetPath)) {
                            New-Item -ItemType Directory -Path $targetPath | Out-Null
                        }
                    } else {
                        Copy-Item -Path $_.FullName -Destination $targetPath -Force
                        Write-Host "  - Copied: $($_.Name)" -ForegroundColor Cyan
                    }
                }
            } else {
                Write-Warning "Source directory not found: $sourceDirPath"
            }
        } else {
            # Handle individual files
            $sourcePath = Join-Path $sourceDir $filePattern
            if (Test-Path $sourcePath) {
                $destPath = Join-Path $tempDir $filePattern
                $destDir = Split-Path -Parent $destPath
                
                # Create destination directory if it doesn't exist
                if (-not (Test-Path $destDir) -and $destDir -ne "") {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                
                Copy-Item -Path $sourcePath -Destination $destPath -Force
                Write-Host "  - Copied: $filePattern" -ForegroundColor Cyan
            } else {
                Write-Warning "File not found: $sourcePath"
            }
        }
    }

    # Update version in manifest.json if needed
    $manifestPath = Join-Path $tempDir "manifest.json"
    if (Test-Path $manifestPath) {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
        $cleanVersion = $Version.TrimStart("v")
        
        if ($manifest.version -ne $cleanVersion) {
            Write-Host "Updating version in manifest.json to $cleanVersion"
            $manifest.version = $cleanVersion
            $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
        }
    }

    # Create zip file
    Write-Host "Creating package: $outputPath"
    Add-Type -Assembly System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $outputPath)

    Write-Host "Extension packaged successfully: $outputPath" -ForegroundColor Green
} catch {
    Write-Host "Error packaging extension: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temporary directory
    if (Test-Path $tempDir) {
        Write-Host "Cleaning up temporary directory"
        Remove-Item $tempDir -Recurse -Force
    }
}
