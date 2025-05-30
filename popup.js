/**
 * Sharepoint Video Catcher - Popup Interface
 * 
 * This script handles the popup UI for the extension, displaying detected videos,
 * provides copy functionality for URLs and commands, and allows users to download
 * subtitle files directly from the interface.
 * 
 * @author Sharepoint Video Catcher Team
 * @version 1.0.0
 * @license MIT
 */

// Create a popup-specific logger instance
const popupLogger = new Logger('Popup');

/**
 * Formats a timestamp into a human-readable date and time string.
 * 
 * @param {number} timestamp - The timestamp to format (in milliseconds since Unix epoch)
 * @returns {string} - Formatted date and time string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Copies the given text to the clipboard and provides visual feedback.
 * 
 * @param {string} text - The text to copy to the clipboard
 * @param {Event} event - The click event from the button that triggered the copy
 */
function copyToClipboard(text, event) {  if (!text || typeof text !== 'string') {
    popupLogger.error('Invalid text provided for clipboard copy');
    showCopyError(event.target, 'Invalid content');
    return;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    // Visual feedback that the copy was successful
    showCopySuccess(event.target);  }).catch(err => {
    popupLogger.error('Failed to copy text: ', err);
    showCopyError(event.target, 'Copy failed');
  });
}

/**
 * Shows a success message on a button after copying.
 * 
 * @param {HTMLElement} button - The button element to update
 */
function showCopySuccess(button) {
  const originalText = button.textContent;
  const originalClass = button.className;
  
  button.textContent = "Copied!";
  button.disabled = true;
  
  // Add a success class if not present
  if (!button.classList.contains('copy-success')) {
    button.classList.add('copy-success');
  }
  
  // Use UI_CONSTANTS with fallback
  const feedbackTimeout = typeof UI_CONSTANTS !== 'undefined' ? UI_CONSTANTS.FEEDBACK_TIMEOUT : 1500;
  
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    button.className = originalClass;
  }, feedbackTimeout);
}

/**
 * Shows an error message on a button when copying fails.
 * 
 * @param {HTMLElement} button - The button element to update
 * @param {string} errorMsg - The error message to display
 */
function showCopyError(button, errorMsg = 'Error') {
  const originalText = button.textContent;
  const originalClass = button.className;
  
  button.textContent = errorMsg;
  button.style.backgroundColor = '#d13438';
  
  // Use UI_CONSTANTS with fallback
  const feedbackTimeout = typeof UI_CONSTANTS !== 'undefined' ? UI_CONSTANTS.FEEDBACK_TIMEOUT : 1500;
  
  setTimeout(() => {
    button.textContent = originalText;
    button.style.backgroundColor = '';
  }, feedbackTimeout);
}

/**
 * Downloads transcript text as a .txt file
 * 
 * @param {string} transcriptText - The transcript text content to download
 * @param {string} baseName - Base name for the downloaded file (without extension)
 */
function downloadTranscriptAsText(transcriptText, baseName) {
  if (!transcriptText || typeof transcriptText !== 'string') {
    popupLogger.error('Invalid transcript text provided for download');
    alert('Invalid transcript data');
    return;
  }
  
  try {
    // Create a Blob containing the transcript text
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a sanitized filename
    const fileName = `${baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    
    // Create a temporary link element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    // Add to the DOM, click to trigger download, then remove
    document.body.appendChild(a);
    a.click();
    
    // Cleanup: remove the element and revoke the object URL
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    popupLogger.info('Transcript downloaded as:', fileName);
  } catch (error) {
    popupLogger.error('Error downloading transcript:', error);
    throw error; // Rethrow the error for the caller to handle
  }
}

/**
 * Displays the list of detected video manifests in the popup UI.
 * Creates DOM elements for each video, including URL and command copy buttons,
 * subtitle download options, and transcript data if available.
 * 
 * @param {Array} manifests - Array of video manifest objects to display
 */
function displayVideoManifests(manifests) {
  const videoListElement = document.getElementById('video-list');
  const noVideosElement = document.getElementById('no-videos');
  const clearAllButton = document.getElementById('clear-all-button');
  
  // Clear previous content
  videoListElement.innerHTML = '';
  
  if (manifests && manifests.length > 0) {
    noVideosElement.style.display = 'none';
    clearAllButton.classList.remove('hidden');
    videoListElement.classList.remove('hidden');
    
    // Sort by timestamp, newest first
    manifests.sort((a, b) => b.timestamp - a.timestamp);
    
    manifests.forEach(video => {
      const videoItem = document.createElement('div');
      videoItem.className = 'video-item';
      
      // Title
      const titleElement = document.createElement('div');
      titleElement.className = 'video-title';
      titleElement.textContent = video.title;
      videoItem.appendChild(titleElement);
        
      // URL section
      const urlContainer = document.createElement('div');
      urlContainer.className = 'command-container';
      
      const urlText = document.createElement('div');
      urlText.className = 'command-text';
      urlText.title = video.url;
      urlText.textContent = video.url;
      urlContainer.appendChild(urlText);
        
      const copyUrlButton = document.createElement('button');
      copyUrlButton.textContent = 'Copy URL';
      copyUrlButton.onclick = function(event) {
        copyToClipboard(video.url, event);
      };
      urlContainer.appendChild(copyUrlButton);
      
      videoItem.appendChild(urlContainer);
      
      // FFmpeg command section
      const commandContainer = document.createElement('div');
      commandContainer.className = 'command-container';
      
      const commandText = document.createElement('div');
      commandText.className = 'command-text';
      commandText.title = video.ffmpegCommand;
      commandText.textContent = video.ffmpegCommand;
      commandContainer.appendChild(commandText);
        
      const copyCommandButton = document.createElement('button');
      copyCommandButton.textContent = 'Copy Command';
      copyCommandButton.onclick = function(event) {
        copyToClipboard(video.ffmpegCommand, event);
      };
      commandContainer.appendChild(copyCommandButton);
      
      videoItem.appendChild(commandContainer);
      
      // Add subtitle section if available
      if (video.subtitleUrl) {
        const subtitleContainer = document.createElement('div');
        subtitleContainer.className = 'command-container subtitle-container';
        
        const subtitleText = document.createElement('div');
        subtitleText.className = 'command-text';
        subtitleText.title = video.subtitleUrl;
        subtitleText.textContent = video.subtitleUrl;
        subtitleContainer.appendChild(subtitleText);
            const copySubtitleButton = document.createElement('button');
        copySubtitleButton.textContent = 'Copy VTT URL';
        copySubtitleButton.onclick = function(event) {
          copyToClipboard(video.subtitleUrl, event);
        };
        subtitleContainer.appendChild(copySubtitleButton);
        
        // Add download button
        const downloadSubtitleButton = document.createElement('button');
        downloadSubtitleButton.textContent = 'Download';        downloadSubtitleButton.onclick = function() {
          try {
            // Create and click a temporary download link
            const a = document.createElement('a');
            a.href = video.subtitleUrl;
            const fileName = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${video.subtitleLanguage || 'en'}.vtt`;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);} catch (error) {
            popupLogger.error('Error downloading subtitle:', error);
            alert('Failed to download subtitle. Please try copying the URL instead.');
          }
        };
        subtitleContainer.appendChild(downloadSubtitleButton);
        
        videoItem.appendChild(subtitleContainer);
      }      // Add transcript section if available
      if (video.transcriptText) {
        const transcriptContainer = document.createElement('div');
        transcriptContainer.className = 'command-container transcript-container';

        const transcriptText = document.createElement('div');
        transcriptText.className = 'command-text';
        transcriptText.title = video.transcriptJsonUrl || 'Transcript';
        transcriptText.textContent = video.transcriptJsonUrl || 'Transcript Data Available';
        transcriptContainer.appendChild(transcriptText);

        const copyTranscriptButton = document.createElement('button');
        copyTranscriptButton.textContent = 'Copy Transcript Data';
        copyTranscriptButton.onclick = function (event) {
          copyToClipboard(video.transcriptText, event);
        };
        transcriptContainer.appendChild(copyTranscriptButton);
        
        // Add download button for transcript text
        const downloadTranscriptButton = document.createElement('button');
        downloadTranscriptButton.textContent = 'Download';
        downloadTranscriptButton.onclick = function() {
          try {
            downloadTranscriptAsText(video.transcriptText, video.title || 'transcript');
          } catch (error) {
            popupLogger.error('Error downloading transcript:', error);
            alert('Failed to download transcript. Please try copying the text instead.');
          }
        };
        transcriptContainer.appendChild(downloadTranscriptButton);

        videoItem.appendChild(transcriptContainer);
      }

      // Timestamp
      const timestampElement = document.createElement('div');
      timestampElement.className = 'timestamp';
      timestampElement.textContent = formatTimestamp(video.timestamp);
      videoItem.appendChild(timestampElement);
      
      videoListElement.appendChild(videoItem);
    });
    
  } else {
    noVideosElement.style.display = 'block';
    clearAllButton.classList.add('hidden');
    videoListElement.classList.add('hidden');
  }
}

/**
 * Event handler for when the popup DOM is loaded.
 * Initializes the Clear All button and loads video manifests to display.
 */
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Setup Clear All button
    const clearAllButton = document.getElementById('clear-all-button');
    clearAllButton.onclick = function() {
      if (confirm('Are you sure you want to clear all detected videos?')) {
        chrome.storage.local.set({videoManifests: []}, function() {
          displayVideoManifests([]);
        });
      }
    };
      // No logger test needed in popup
    
    // Initially hide the Clear All button (will show it only if videos exist)
    clearAllButton.classList.add('hidden');

    // Load video manifests from storage
    const result = await chrome.storage.local.get(['videoManifests']);
    const videoManifests = result.videoManifests || [];
    
    // Show or hide Clear All button based on whether there are videos
    if (videoManifests.length > 0) {
      clearAllButton.classList.remove('hidden');
    } else {
      clearAllButton.classList.add('hidden');
      addDebugInfoLink();
    }
    
    // Display the video manifests
    displayVideoManifests(videoManifests);  } catch (error) {
    popupLogger.error('Error initializing popup:', error);
    displayError('An error occurred while loading the video list');
  }
});

/**
 * Adds a debug info link to the "no videos" message.
 * Provides users with helpful information when no videos are detected.
 */
function addDebugInfoLink() {
  const noVideosElement = document.getElementById('no-videos');
  
  // Create debug info link
  const debugLink = document.createElement('a');
  debugLink.href = '#';
  debugLink.textContent = 'Show debug info';
  debugLink.style.display = 'block';
  debugLink.style.marginTop = '10px';
  debugLink.style.textAlign = 'center';
  debugLink.style.fontSize = '12px';
  
  debugLink.onclick = function(e) {
    e.preventDefault();
    const debugInfo = document.createElement('div');
    debugInfo.className = 'debug-info';
    debugInfo.style.fontSize = '11px';
    debugInfo.style.color = '#555';
    debugInfo.style.marginTop = '10px';
    debugInfo.style.padding = '8px';
    debugInfo.style.backgroundColor = '#f0f0f0';
    debugInfo.style.borderRadius = '4px';
      const hostInfo = document.createElement('p');
    hostInfo.textContent = `Current host: ${window.location.host}`;
    debugInfo.appendChild(hostInfo);
    
    const urlInfo = document.createElement('p');
    const domains = typeof DEFAULT_OPTIONS !== 'undefined' ? DEFAULT_OPTIONS.domains.join(', ') : '*://*.sharepoint.com/*, *://*.svc.ms/*';
    urlInfo.textContent = `Extension is monitoring URLs matching: ${domains}`;
    debugInfo.appendChild(urlInfo);
    
    const tipInfo = document.createElement('p');
    tipInfo.textContent = 'Tip: Make sure to play the video completely or seek through it to generate the video manifest request.';
    debugInfo.appendChild(tipInfo);
    
    noVideosElement.appendChild(debugInfo);
    debugLink.style.display = 'none';
  };
  
  noVideosElement.appendChild(debugLink);
}

/**
 * Displays an error message to the user.
 * 
 * @param {string} message - The error message to display
 */
function displayError(message) {
  const videoListElement = document.getElementById('video-list');
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  errorElement.style.color = 'red';
  errorElement.style.padding = '10px';
  errorElement.style.textAlign = 'center';
  
  videoListElement.innerHTML = '';
  videoListElement.appendChild(errorElement);
}
