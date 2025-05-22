# Getting Started with Sharepoint Video Catcher

This guide will help you set up and start using the Sharepoint Video Catcher extension.

## Installation

### Prerequisites
- Google Chrome or Microsoft Edge browser
- Access to a Sharepoint site with videos
- ffmpeg (optional, for downloading videos)

### Installing the Extension

1. Download the extension from the releases section or build it yourself using the build script
2. Open your browser's extension page:
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The Sharepoint Video Catcher icon should appear in your browser toolbar

### Installing ffmpeg (for downloading videos)

#### Windows
1. Download ffmpeg from [ffmpeg.org](https://ffmpeg.org/download.html) or use a package manager like Chocolatey:
   ```
   choco install ffmpeg
   ```
2. Add ffmpeg to your system PATH

#### macOS
1. Install using Homebrew:
   ```
   brew install ffmpeg
   ```

#### Linux
1. Install using your distribution's package manager:
   ```
   sudo apt update && sudo apt install ffmpeg  # Debian/Ubuntu
   sudo dnf install ffmpeg                    # Fedora
   ```

## Using the Extension

1. Visit a Sharepoint site that contains videos
2. Play a video to trigger the URL detection
3. Click the Sharepoint Video Catcher icon in your browser toolbar
4. You should see the detected video with options to:
   - Copy the video URL
   - Copy an ffmpeg command for downloading

5. To download a video:
   - Copy the ffmpeg command
   - Open a terminal or command prompt
   - Paste and run the command
   - The video will be saved to your current directory

## Customizing Settings

1. Right-click the extension icon and select "Options"
2. You can customize:   - Maximum number of videos to store
   - Default file extension
   - Notification preferences
   - ffmpeg command template
   - Debug logging settings

## Debug Logging

The extension includes an enhanced logging system that can help troubleshoot issues:

1. Right-click the extension icon and select "Options"
2. Scroll down to the "Enable debug logging" checkbox and check it
3. Select your preferred log level:
   - None: Disables all logging
   - Error: Shows only critical errors
   - Warning: Shows errors and warnings
   - Info: Shows errors, warnings, and general information
   - Debug: Shows all messages, including detailed debugging information

4. To view logs:
   - Open your browser's Developer Tools (F12 or Ctrl+Shift+I)
   - Go to the "Console" tab
   - Filtered logs will appear with the [SharepointVideoCatcher] prefix

5. For advanced testing, you can use the logger-test.js script:
   - With debug mode enabled, open the browser console
   - Type `loggerTest()` and press Enter
   - This will demonstrate all log levels and formatting

## Troubleshooting

- If videos aren't being detected, make sure you're on a Sharepoint site and have played the video
- Check that the video is using a compatible format
- For additional help, see the test-guide.html file included with the extension

## Getting Help

If you encounter any issues:
1. Check the README.md and test-guide.html for troubleshooting tips
2. Submit an issue on the GitHub repository
