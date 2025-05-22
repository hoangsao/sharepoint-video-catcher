# Sharepoint Video Catcher

A browser extension for Microsoft Edge or Chrome that helps detect and download videos from Sharepoint sites.

## Features

- Automatically detects video manifest URLs on Sharepoint websites
- Removes the `enableCdn=1` parameter from video URLs
- Creates ready-to-use ffmpeg commands for video downloading
- Shows video title, URL, and download command
- Allows one-click copying of URLs and ffmpeg commands
- Stores the last 20 detected videos
- Detects and extracts video subtitles (VTT files)
- Captures video transcripts from SharePoint
- Allows downloading and copying subtitle/transcript content

## How to use

1. Install the extension in your browser
2. Browse to any Sharepoint site containing videos
3. Play videos on the site to trigger manifest URL detection
4. Click the extension icon to view detected videos
5. Copy the ffmpeg command and paste it into your terminal to download the video
6. For subtitles: Use the "Copy VTT URL" or "Download" button to access the subtitles
7. For transcripts: Click "Copy Transcript Data" to copy the full transcript text

## Debug Logging

The extension includes an enhanced logging system that can be configured in the options:

1. Open the extension options page
2. Check "Enable debug logging" to turn on logging
3. Select a log level:
   - None: No logging output
   - Error: Only error messages
   - Warning: Errors and warnings
   - Info: Errors, warnings, and informational messages
   - Debug: All log messages, including detailed debug information

Logging is automatically disabled in production environments for optimal performance.
Developers can enable it for troubleshooting issues or understanding extension behavior.

## Requirements

- For downloading: ffmpeg must be installed on your system
- Compatible with Microsoft Edge and Google Chrome

## Extension Permissions

This extension requires the following permissions:

- **webRequest**: Required to monitor and detect video manifest URLs
- **storage**: Required to store detected videos and extension settings
- **clipboardWrite**: Required to copy URLs and ffmpeg commands to clipboard
- **activeTab** and **tabs**: Required to get tab information and title for filename generation
- **scripting**: Required to extract page title for video filenames
- **notifications**: Required for video detection notifications
- **host_permissions** for Sharepoint domains: Required to monitor network traffic on Sharepoint sites

## Installation

### Loading the unpacked extension (Developer Mode)

1. Clone or download this repository
2. Open your browser and go to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension should now be installed and ready to use

### Building for Distribution

To create a packaged extension file (ZIP):

1. Make sure you have PowerShell installed
2. Run the build script with the desired version:
   ```
   .\build.ps1 -Version "1.0.0"
   ```
3. The packaged extension will be created in the `dist` folder

## Customizing the Extension

You can customize several aspects of the extension via the options page:

1. Click on the extension icon in your browser
2. Right-click and select "Options" or "Extension options"
3. Adjust settings such as:
   - Maximum number of videos to store
   - Default file extension
   - Whether to show notifications when videos are detected
   - Custom ffmpeg command template
   - Video and transcript detection keywords
   - Subrequest parameters for API calls

## Usage Notes

- The extension monitors network requests on Sharepoint sites to detect video manifests
- Video file names are generated from page titles
- If a page title doesn't end with .mp4, the extension will add it automatically
- The extension prevents duplicate videos by extracting a unique identifier from the URL
- Subtitle and transcript detection works automatically when playing videos with captions
- Transcripts are organized by speaker when available

## Changelog

### Version 1.0.0
- Initial public release
- Enhanced video detection patterns
- Improved user interface with debug information
- Fixed URL pattern issues
- Fixed notification image loading issue
- Added better duplicate detection using unique ID extraction from docid parameter
- Improved stability and fixed various bugs
- Added subtitle (VTT) detection and download capability
- Added transcript text capture from SharePoint videos
- Improved transcript formatting with speaker identification
- Added new configuration options for transcript detection

## Usage Example

Here's a typical workflow for using the extension:

1. Navigate to a Sharepoint site containing a video
2. Play the video to trigger the network request
3. Click on the extension icon in your browser toolbar
4. You'll see the detected video with its title
5. Click "Copy Command" to copy the ffmpeg command
6. Open a terminal or command prompt
7. Paste and run the ffmpeg command:
   ```
   ffmpeg -i "https://company.sharepoint.com/sites/videos/_layouts/15/Videomanifest.aspx?id=01ABCDEF-1234-5678-ABCD-123456789ABC" -codec copy "Meeting Recording.mp4"
   ```
8. The video will be downloaded to your current directory
9.To get subtitles: Click "Download" under the subtitle section to save the VTT file
10. For transcripts: Click "Copy Transcript Data" to get the formatted transcript text

## License

MIT

## Documentation

- [Getting Started Guide](GETTING-STARTED.md) - Installation and basic usage
- [Logger Documentation](LOGGER.md) - Using the enhanced logging system
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
