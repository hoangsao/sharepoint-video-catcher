/**
 * Sharepoint Video Catcher - Background Service Worker
 * 
 * This script serves as the core of the extension, monitoring web requests
 * to detect and capture video manifest URLs from Sharepoint sites.
 * It intercepts network requests matching specific patterns and extracts
 * information needed to download videos and transcripts.
 * 
 * @author Sharepoint Video Catcher Team
 * @version 1.0.0
 * @license MIT
 */

// Import the logger first
try {
  importScripts('logger.js');
} catch (e) {
  console.error('Failed to load logger.js:', e);
}

// Create a background-specific logger instance
const bgLogger = new Logger('Background');

// Import logger test functions
try {
  importScripts('logger-test.js');
  bgLogger.debug('Logger test script loaded');
} catch (e) {
  bgLogger.error('Failed to load logger test script:', e);
}

/**
 * Extracts a specific token from a URL path based on the provided identifier.
 * For example, extracting the item ID from a path like "/items/123456".
 * 
 * @param {string} url - The URL to extract the token from
 * @param {string} findIdToken - The identifier to search for in the URL path (default: 'items')
 * @returns {string|null} - The extracted token or null if not found
 */
function extractUrlPathToken (url, findIdToken = 'items') {  try {
    const urlObj = new URL(url);
    const regexPattern = `\\/${findIdToken}\\/([^\\/]+)`;
    const regex = new RegExp(regexPattern);
    const match = urlObj.pathname.match(regex);
    if (match) {
      return match[1];
    }
  } catch (e) {
    bgLogger.error('Error extracting URL path token:', e);
  }
  return null; // Return null if no match found
}

/**
 * Extracts a unique identifier for a video from its URL.
 * Attempts to extract from docid parameter first, then falls back to the URL path.
 * 
 * @param {string} url - The URL to extract the unique ID from
 * @returns {string} - The extracted unique ID or the full URL as a fallback
 */
// Function to extract docid or a unique identifier from URL
function extractVideoUniqueId (url) {
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
          const uniqueId = extractUrlPathToken(decodedDocid, 'items');
          if (uniqueId) {
            return uniqueId;
          }
        }
        return docid; // Use docid as is if it's not a URL
      } catch (e) {
        return docid; // If there's an error decoding, use the original docid
      }
    }

    // If no docid, use the path without query parameters as unique identifier
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    bgLogger.error('Error extracting unique ID:', e);
    return url; // Fallback to the full URL if parsing fails
  }
}

/**
 * Extracts the unique identifier for a transcript from its URL.
 * Uses the 'items' token from the URL path.
 * 
 * @param {string} url - The URL to extract the transcript unique ID from
 * @returns {string|null} - The extracted unique ID or null if not found
 */
function extractTranscriptUniqueId (url) {
  return extractUrlPathToken(url, 'items');
}

// Helper function to get active tab
/**
 * Retrieves the currently active browser tab.
 * 
 * @returns {Promise<chrome.tabs.Tab>} - Promise resolving to the active tab
 */
async function getActiveTab () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Executes a JavaScript function in the context of the specified tab.
 * 
 * @param {number} tabId - The ID of the tab to execute the script in
 * @param {Function} func - The function to execute in the tab
 * @returns {Promise<any>} - Promise resolving to the result of the function execution
 */
// Helper function to execute script in active tab
async function executeScriptInTab (tabId, func) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func
  });
  return result && result[0] && result[0].result;
}

/**
 * Extracts a filename from a video URL.
 * Attempts to extract a filename from the 'id' parameter in the URL.
 * 
 * @param {string} url - The URL to extract the filename from
 * @returns {string} - The extracted filename or a default name if extraction fails
 */
function extractVideoFileName (url) {
  const defaultVideoFileName = 'video.mp4';
  try {
    const urlObj = new URL(url);

    // Extract id parameter if it exists
    const id = urlObj.searchParams.get('id');

    if (id) {
      // If id is an encoded URL, decode it and extract the base part
      const decodedId = decodeURIComponent(id);
      const regex = /\/([^\/]+)$/;
      const match = decodedId.match(regex);
      if (match) {
        return match[1];
      }
    }
  } catch (e) {
    bgLogger.error('Error extracting video filename:', e);
  }

  return defaultVideoFileName;
}

/**
 * Creates or updates a video manifest in local storage.
 * Stores video metadata including URL, title, timestamp, and commands.
 * Manages the list of manifests based on the configured maximum items.
 * 
 * @param {Object} param0 - Object containing the video manifest data
 * @param {string} param0.uniqueId - Unique identifier for the video
 * @param {Object} options - Options for managing the manifest storage
 * @returns {Array|null} - The updated array of manifests or null if operation failed
 */
async function createOrUpdateVideoManifest ({ uniqueId, ...item } = {}, options) {
  if (!uniqueId) {
    bgLogger.error('No uniqueId provided for video manifest');
    return null;
  }

  let manifest = {
    ...item,
    uniqueId: uniqueId,
    timestamp: new Date().getTime()
  };
  const videoManifestsResult = await chrome.storage.local.get(['videoManifests']);
  let manifests = videoManifestsResult?.videoManifests || [];
  let manifestIndex = manifests.findIndex(x => x.uniqueId === uniqueId);
  if (manifestIndex !== -1) {
    manifest = { ...manifests[manifestIndex], ...manifest };
    manifests.splice(manifestIndex, 1);
  }

  manifests.unshift(manifest);
  if (options && options.maxItems && manifests.length > options.maxItems) {
    manifests.splice(options.maxItems - manifests.length);
  }

  // Store the updated manifests in local storage
  chrome.storage.local.set({ videoManifests: manifests });
  bgLogger.info('Video manifest inserted/updated', uniqueId);

  return manifests;
}

/**
 * Fetches JSON data from a specified API URL.
 * Adds subrequest parameters to the URL before fetching.
 * 
 * @param {string} url - The base URL to fetch data from
 * @param {string[]} subrequestParams - Array of parameters to add to the URL
 * @returns {Object|null} - The parsed JSON response or null if the fetch fails
 */
async function fetchApiData (url, subrequestParams) {
  if (!url) {
    bgLogger.error('No URL provided for fetching API data');
    return null;
  }

  // Build the URL with all the subrequest parameters
  let fetchUrl = url;
  if (Array.isArray(subrequestParams) && subrequestParams.length > 0) {
    subrequestParams.forEach(param => {
      const separator = fetchUrl.includes('?') ? '&' : '?';
      fetchUrl += fetchUrl.includes(param) ? '' : `${separator}${param}`;
    });
  }

  try {
    // Fetch the response body to extract the data
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const dataJson = await response.json();
      return dataJson;
    } else {
      bgLogger.warn(`Received non-JSON response for ${fetchUrl}. Content-Type: ${contentType}`);
      return await response.text();
    }
  } catch (error) {
    bgLogger.error('Error fetching API data:', error);
    return null;
  }
}

/**
 * Initializes all web request listeners for the extension.
 * Sets up listeners for video manifests and transcript detection based on current options.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function initializeListeners () {
  const options = await chrome.storage.sync.get({
    domains: ["*://*.sharepoint.com/*", "*://*.svc.ms/*"],
    removeParams: ["enableCdn"],
    videoKeywords: ["videomanifest"],
    transcriptKeywords: ["select=media/transcripts", "select=media%2Ftranscripts"],
    subrequestParams: ["subRequest=true", "isCustomized=true"],
    fileExtension: '.mp4',
    ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"',
    maxItems: 20,
    notifyOnDetection: false
  });

  // Debug logger for requests (can be disabled in production)
  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    // Check if URL contains any of the video keywords
    if (matchesVideoKeywords(details.url, options.videoKeywords)) {
      bgLogger.debug('Potential video URL detected:', details.url);
    }

    // Check if URL contains any of the transcript keywords
    if (matchesAnyKeywords(details.url, options.transcriptKeywords) &&
      !matchesAnyKeywords(details.url, options.subrequestParams)) {
      bgLogger.debug('Potential transcript URL detected:', details.url);
    }
  }, { urls: options.domains }, []);
  /**
   * Main listener for video manifest detection.
   * This captures video manifests and processes them to extract download information.
   */
  chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
      // Skip URLs that already contain subrequest parameters
      if (containsAnySubrequestParams(details.url, options.subrequestParams)) {
        return;
      }

      // Extract the base URL without query parameters
      const urlWithoutParams = details.url.split('?')[0];

      // Check if URL matches any of the video keywords
      if (matchesAnyKeywords(urlWithoutParams, options.videoKeywords) ||
        matchesAnyKeywords(details.url, options.videoKeywords)) {

        bgLogger.info('Video manifest detected:', details.url);

        // Remove unwanted parameters
        let modifiedUrl = details.url;
        options.removeParams.forEach(param => {
          const pattern = new RegExp(`([&?])${param}=[^&]*(&|$)`, 'g');
          modifiedUrl = modifiedUrl.replace(pattern, function (match, p1, p2) {
            return p2 === '&' ? p1 : '';  // If followed by &, keep the prefix, otherwise remove it
          });
        });

        bgLogger.debug('Modified URL:', modifiedUrl);

        try {
          // Get active tab and document title for filename
          const activeTab = await getActiveTab();
          const documentTitle = await executeScriptInTab(activeTab.id, () => document.title) || 
                               activeTab.title || 
                               'video.mp4';
                               
          // Create a clean filename from the title
          let fileName = documentTitle.trim();

          // Add file extension if needed
          if (!fileName.toLowerCase().endsWith(options.fileExtension)) {
            fileName += options.fileExtension;
          }

          // Create the ffmpeg command using template
          const ffmpegCommand = options.ffmpegTemplate
            .replace('{url}', modifiedUrl)
            .replace('{filename}', fileName);

          bgLogger.info('FFMPEG Command:', ffmpegCommand);

          // Store the video information
          const videoInfo = {
            title: fileName,
            url: modifiedUrl,
            uniqueId: extractVideoUniqueId(modifiedUrl),
            ffmpegCommand: ffmpegCommand,
            timestamp: new Date().getTime()
          };

          const manifests = await createOrUpdateVideoManifest(videoInfo, {
            maxItems: options.maxItems
          });

          // Show notification if enabled
          if (options.notifyOnDetection && manifests !== null) {
            await chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon128.png',
              title: 'Sharepoint Video Detected',
              message: `Found: ${fileName}`
            });
          }
        } catch (error) {
          bgLogger.error('Error processing video manifest:', error);
        }
      }      // Check if URL matches any of the transcript keywords
      if (matchesAnyKeywords(details.url, options.transcriptKeywords)) {
        bgLogger.debug('Potential subtitle request detected:', details.url);

        try {
          const transcriptJson = await fetchApiData(details.url, options.subrequestParams);
          if (transcriptJson && transcriptJson.media && 
              transcriptJson.media.transcripts &&
              transcriptJson.media.transcripts.length > 0) {

            // Extract VTT URL from the response
            const transcript = transcriptJson.media.transcripts.find(t =>
              t.transcriptType === "subtitle" && t.temporaryDownloadUrl);

            if (transcript && transcript.temporaryDownloadUrl) {
              bgLogger.info('Found VTT URL:', transcript.temporaryDownloadUrl);

              // Store the subtitle info with the video ID
              const subtitleInfo = {
                subtitleUrl: transcript.temporaryDownloadUrl,
                subtitleLanguage: transcript.languageTag || 'en-US',
                timestamp: new Date().getTime(),
                uniqueId: extractTranscriptUniqueId(details.url)
              };

              await createOrUpdateVideoManifest(subtitleInfo, {
                maxItems: options.maxItems
              });
              bgLogger.info('Added subtitle URL to existing video');
            }
          }
        } catch (error) {
          bgLogger.error('Error fetching subtitle data:', error);
        }
      }

      // Check if URL matches any of the transcript json keywords
      if (containsAllRequiredSubstrings(details.url, ['transcripts', 'streamContent'])) {
        bgLogger.debug('Potential transcript JSON request detected:', details.url);
        
        try {
          const transcriptJson = await fetchApiData(details.url, options.subrequestParams);
          
          if (!transcriptJson || !transcriptJson.entries || !Array.isArray(transcriptJson.entries)) {
            bgLogger.warn('No valid transcript entries found in response');
            return;
          }
          
          let result = [];
          let speakerId = null;
          
          transcriptJson.entries.forEach(item => {
            if (item.speakerId !== speakerId) {
              result.push(item.speakerDisplayName || 'Speaker');
              speakerId = item.speakerId;
            }

            result.push(`\t${item.text || ''}`);
          });

          const transcriptText = result.join('\r\n');
          
          // Store the transcript info with the video ID
          const transcriptInfo = {
            transcriptText: transcriptText,
            transcriptJsonUrl: details.url,
            timestamp: new Date().getTime(),
            uniqueId: extractUrlPathToken(details.url, 'items')
          };
          
          await createOrUpdateVideoManifest(transcriptInfo, {
            maxItems: options.maxItems
          });
          bgLogger.info('Added transcript JSON to existing video');
        } catch (error) {
          bgLogger.error('Error fetching transcript JSON data:', error);
        }
      }
    },
    { urls: options.domains },
    ["requestBody"]
  );
}

/**
 * Checks if a given string contains all specified substrings.
 *
 * @param {string} mainString - The string to be checked.
 * @param {string[]} requiredSubstrings - An array of substrings that must all be present in the mainString.
 * @returns {boolean} - Returns true if the mainString contains all substrings from the array, otherwise false.
 */
function containsAllRequiredSubstrings (mainString, requiredSubstrings) {
  if (typeof mainString !== 'string') {
    bgLogger.error("Error: 'mainString' must be a string.");
    return false;
  }

  if (!Array.isArray(requiredSubstrings)) {
    bgLogger.error("Error: 'requiredSubstrings' must be an array.");
    return false;
  }

  for (const substring of requiredSubstrings) {
    if (!mainString.includes(substring)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a URL matches any of the specified keywords.
 * Case-insensitive matching is used.
 * 
 * @param {string} url - The URL to check
 * @param {string[]} keywords - Array of keywords to match against the URL
 * @returns {boolean} - True if the URL contains any of the keywords, false otherwise
 */
function matchesAnyKeywords (url, keywords) {
  if (!url || !keywords || !Array.isArray(keywords)) {
    return false;
  }
  const lowerUrl = url.toLowerCase();
  return keywords.some(keyword => lowerUrl.includes(keyword.toLowerCase()));
}

/**
 * Alias for matchesAnyKeywords for backward compatibility.
 * Specifically used for checking if a URL contains video-related keywords.
 * 
 * @param {string} url - The URL to check
 * @param {string[]} keywords - Array of video-related keywords
 * @returns {boolean} - True if the URL contains any of the keywords
 */
function matchesVideoKeywords (url, keywords) {
  return matchesAnyKeywords(url, keywords);
}

/**
 * Checks if a URL already contains any of the specified subrequest parameters.
 * 
 * @param {string} url - The URL to check
 * @param {string[]} params - Array of subrequest parameters to check for
 * @returns {boolean} - True if the URL contains any of the parameters
 */
function containsAnySubrequestParams (url, params) {
  if (!url || !params || !Array.isArray(params)) {
    return false;
  }
  const lowerUrl = url.toLowerCase();
  return params.some(param => lowerUrl.includes(param.toLowerCase()));
}

/**
 * Extension initialization on install or update.
 * Sets up event listeners, initializes storage, and shows a welcome notification.
 */
chrome.runtime.onInstalled.addListener(async function () {  bgLogger.info('Sharepoint Video Catcher extension installed/updated');
  bgLogger.info('Extension is monitoring URLs matching: *://*.sharepoint.com/* and *://*.svc.ms/*');

  try {
    // Initialize listeners with current options
    await initializeListeners();

    // Initialize storage if needed
    const result = await chrome.storage.local.get(['videoManifests']);
    if (!result.videoManifests) {
      await chrome.storage.local.set({ videoManifests: [] });
    } else {
      bgLogger.info('Found existing video manifests:', result.videoManifests.length);
    }

    // Initialize sync storage with default options if needed
    const defaultSettings = {
      maxItems: 20,
      fileExtension: '.mp4',
      notifyOnDetection: false,
      ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"'
    };
    
    const items = await chrome.storage.sync.get(defaultSettings);
    await chrome.storage.sync.set(items);

    // Create a notification to confirm the extension is running
    if (chrome.notifications) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Sharepoint Video Catcher',
        message: 'Extension is now active and monitoring Sharepoint sites for videos'
      });
    }
  } catch (error) {
    bgLogger.error('Error during extension initialization:', error);
  }
});

/**
 * Listener for changes to extension options.
 * Reinitializes listeners when key options change.
 */
chrome.storage.onChanged.addListener(async function (changes, namespace) {
  if (namespace === 'sync' &&
    (changes.domains ||
      changes.videoKeywords ||
      changes.removeParams ||
      changes.transcriptKeywords ||
      changes.subrequestParams)) {
    bgLogger.info('Options changed, reloading listeners');

    try {
      // Remove existing listeners (if needed - webRequest API doesn't actually
      // have a clear removeListener without the original callback reference)
      
      // Re-initialize with new options
      await initializeListeners();
    } catch (error) {
      bgLogger.error('Error reloading listeners:', error);
    }
  }
});
