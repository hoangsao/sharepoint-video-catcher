// Popup JavaScript for Sharepoint Video Catcher

// Function to format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Function to copy text to clipboard
function copyToClipboard(text, event) {
  navigator.clipboard.writeText(text).then(() => {
    // Visual feedback that the copy was successful
    const copyButton = event.target;
    const originalText = copyButton.textContent;
    copyButton.textContent = "Copied!";
    copyButton.disabled = true;
    
    setTimeout(() => {
      copyButton.textContent = originalText;
      copyButton.disabled = false;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Function to display video manifests
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

// Load video manifests when popup is opened
document.addEventListener('DOMContentLoaded', function() {
  // Setup Clear All button
  const clearAllButton = document.getElementById('clear-all-button');
  clearAllButton.onclick = function() {
    if (confirm('Are you sure you want to clear all detected videos?')) {
      chrome.storage.local.set({videoManifests: []}, function() {
        displayVideoManifests([]);
      });
    }
  };
  
  // Initially hide the Clear All button (will show it only if videos exist)
  clearAllButton.classList.add('hidden');

  chrome.storage.local.get(['videoManifests'], function(result) {
    // Show or hide Clear All button based on whether there are videos
    if (result.videoManifests && result.videoManifests.length > 0) {
      clearAllButton.classList.remove('hidden');
    } else {
      clearAllButton.classList.add('hidden');
    }
    
    displayVideoManifests(result.videoManifests);
    
    // Add debug info
    const noVideosElement = document.getElementById('no-videos');
    if (!result.videoManifests || result.videoManifests.length === 0) {
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
        urlInfo.textContent = 'Extension is monitoring URLs matching: *://*.sharepoint.com/*';
        debugInfo.appendChild(urlInfo);
        
        const tipInfo = document.createElement('p');
        tipInfo.textContent = 'Tip: Make sure to play the video completely or seek through it to generate the video manifest request.';
        debugInfo.appendChild(tipInfo);
        
        noVideosElement.appendChild(debugInfo);
        debugLink.style.display = 'none';
      };
      noVideosElement.appendChild(debugLink);
    }
  });
});
