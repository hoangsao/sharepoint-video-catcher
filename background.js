// Function to extract docid or a unique identifier from URL
function extractUniqueId (url) {
  try {
    const urlObj = new URL(url);

    // Extract docid parameter if it exists
    const docid = urlObj.searchParams.get('docid');

    if (docid) {
      try {
        // If docid is an encoded URL, decode it and extract the base part
        const decodedDocid = decodeURIComponent(docid);
        if (decodedDocid.startsWith('http')) {
          // If it's a valid URL, use it without parameters
          const docidUrl = new URL(decodedDocid);
          return docidUrl.origin + docidUrl.pathname;
        }
        return docid; // Use docid as is if it's not a URL
      } catch (e) {
        return docid; // If there's an error decoding, use the original docid
      }
    }

    // If no docid, use the path without query parameters as unique identifier
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    console.error('Error extracting unique ID:', e);
    return url; // Fallback to the full URL if parsing fails
  }
}

// Load options and initialize listeners
function initializeListeners() {
  chrome.storage.sync.get({
    domains: ["*://*.sharepoint.com/*", "*://*.svc.ms/*"],
    removeParams: ["enableCdn"],
    videoKeywords: ["videomanifest"],
    fileExtension: '.mp4',
    ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"',
    maxItems: 20,
    notifyOnDetection: false
  }, function(options) {
    // Debug logger for requests (can be disabled in production)
    chrome.webRequest.onBeforeRequest.addListener(function (details) {
      // Check if URL contains any of the video keywords
      if (matchesVideoKeywords(details.url, options.videoKeywords)) {
        console.log('Potential video URL detected:', details.url);
      }
    },
    { urls: options.domains },
    []);

    // Listen for web requests to catch video manifest URLs
    chrome.webRequest.onBeforeRequest.addListener(
      function (details) {
        // Extract the base URL without query parameters
        const urlWithoutParams = details.url.split('?')[0];

        // Check if URL matches any of the video keywords
        if (matchesVideoKeywords(urlWithoutParams, options.videoKeywords) ||
            matchesVideoKeywords(details.url, options.videoKeywords)) {

          console.log('Video manifest detected:', details.url);

          // Remove unwanted parameters
          let modifiedUrl = details.url;
          options.removeParams.forEach(param => {
            const pattern = new RegExp(`([&?])${param}=[^&]*(&|$)`, 'g');
            modifiedUrl = modifiedUrl.replace(pattern, function (match, p1, p2) {
              return p2 === '&' ? p1 : '';  // If followed by &, keep the prefix, otherwise remove it
            });
          });

          console.log('Modified URL:', modifiedUrl);

          // Store the URL for future reference
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs && tabs[0]) {
              const tabId = tabs[0].id;

              // Execute script to get the actual HTML document title
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => document.title
              }, function (result) {
                // Get the document title from the result or fall back to tab title
                const documentTitle = result && result[0] && result[0].result ? result[0].result : tabs[0].title;

                // Create a clean filename from the title
                let fileName = documentTitle.trim();

                // Get user preferences
                chrome.storage.sync.get({
                  fileExtension: '.mp4',
                  ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"',
                  maxItems: 20,
                  notifyOnDetection: false
                }, function (options) {
                  // Add file extension if needed
                  if (!fileName.toLowerCase().endsWith(options.fileExtension)) {
                    fileName += options.fileExtension;
                  }

                  // Create the ffmpeg command using template
                  const ffmpegCommand = options.ffmpegTemplate
                    .replace('{url}', modifiedUrl)
                    .replace('{filename}', fileName);

                  console.log('FFMPEG Command:', ffmpegCommand);

                  // Store the video information
                  const videoInfo = {
                    title: documentTitle,
                    url: modifiedUrl,
                    uniqueId: extractUniqueId(modifiedUrl),
                    ffmpegCommand: ffmpegCommand,
                    timestamp: new Date().getTime()
                  };

                  // Store in local storage
                  chrome.storage.local.get(['videoManifests'], function (result) {
                    let manifests = result.videoManifests || [];

                    // Show notification if enabled or if it's the first detection
                    if (options.notifyOnDetection || manifests.length === 0) {
                      chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png',
                        title: 'Sharepoint Video Detected',
                        message: `Found: ${documentTitle}`
                      });
                    }

                    // Check if this URL is already in the list using the uniqueId
                    const existingIndex = manifests.findIndex(item =>
                      item.uniqueId === videoInfo.uniqueId || item.url === modifiedUrl
                    );

                    if (existingIndex === -1) {
                      manifests.push(videoInfo);
                      // Keep only the last N items based on user preference
                      if (manifests.length > options.maxItems) {
                        manifests = manifests.slice(-options.maxItems);
                      }
                      chrome.storage.local.set({ videoManifests: manifests });
                      console.log('Video added to storage, total count:', manifests.length);
                    } else {
                      console.log('Video already in storage, skipping');
                    }
                  });
                });
              });
            }
          });
        }
      },
      { urls: options.domains },
      ["requestBody"]
    );
  });
}

// Helper function to check if a URL matches any of the video keywords
function matchesVideoKeywords(url, keywords) {
  const lowerUrl = url.toLowerCase();
  return keywords.some(keyword => lowerUrl.includes(keyword.toLowerCase()));
}

// Background script for Sharepoint Video Catcher

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function () {
  console.log('Sharepoint Video Catcher extension installed/updated');
  console.log('Extension is monitoring URLs matching: *://*.sharepoint.com/* and *://*.svc.ms/*');

  // Initialize listeners with current options
  initializeListeners();

  // Initialize storage if needed
  chrome.storage.local.get(['videoManifests'], function (result) {
    if (!result.videoManifests) {
      chrome.storage.local.set({ videoManifests: [] });
    } else {
      console.log('Found existing video manifests:', result.videoManifests.length);
    }
  });

  // Initialize sync storage with default options if needed
  chrome.storage.sync.get({
    maxItems: 20,
    fileExtension: '.mp4',
    notifyOnDetection: false,
    ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"'
  }, function (items) {
    chrome.storage.sync.set(items);
  });

  // Create a notification to confirm the extension is running
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Sharepoint Video Catcher',
      message: 'Extension is now active and monitoring Sharepoint sites for videos'
    });
  }
});

// Listen for changes to the options
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && 
      (changes.domains || changes.videoKeywords || changes.removeParams)) {
    console.log('Options changed, reloading listeners');
    
    // Remove existing listeners
    chrome.webRequest.onBeforeRequest.removeListener();
    
    // Re-initialize with new options
    initializeListeners();
  }
});
