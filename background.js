function extractUrlPathToken (url, findIdToken = 'items') {
  try {
    const urlObj = new URL(url);
    const regexPattern = `\\/${findIdToken}\\/([^\\/]+)`;
    const regex = new RegExp(regexPattern);
    const match = urlObj.pathname.match(regex);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.error('Error extracting URL path token:', e);
  }
  return null; // Return null if no match found
}

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
    console.error('Error extracting unique ID:', e);
    return url; // Fallback to the full URL if parsing fails
  }
}

function extractTranscriptUniqueId (url) {
  return extractUrlPathToken(url, 'items');
}

// Helper function to get active tab
async function getActiveTab () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Helper function to execute script in active tab
async function executeScriptInTab (tabId, func) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func
  });
  return result && result[0] && result[0].result;
}

function extractVideoFileName (url) {
  const defaultVideoFileName = 'video.mp4';
  try {
    const urlObj = new URL(url);

    // Extract id parameter if it exists
    const id = urlObj.searchParams.get('id');

    if (id) {
      // If docid is an encoded URL, decode it and extract the base part
      const decodedId = decodeURIComponent(id);
      const regex = /\/([^\/]+)$/;
      const match = decodedId.match(regex);
      if (match) {
        return match[1]
      }
    }
  } catch (e) {
    console.error('Error extracting unique ID:', e);
  }

  return defaultVideoFileName;
}

async function createOrUpdateVideoManifest ({ uniqueId, ...item } = {}, options) {
  if (!uniqueId) {
    console.error('No uniqueId provided for video manifest');
    return null;
  }

  let manifest = {
    ...item,
    uniqueId: uniqueId,
    timestamp: new Date().getTime()
  }
  const videoManifestsResult = await chrome.storage.local.get(['videoManifests']);
  let manifests = videoManifestsResult?.videoManifests || [];
  let manifestIndex = manifests.findIndex(x => x.uniqueId === uniqueId)
  if (manifestIndex !== -1) {
    manifest = { ...manifests[manifestIndex], ...manifest };
    manifests.splice(manifestIndex, 1);
  }

  manifests.unshift(manifest)
  if (options && options.maxItems && manifests.length > options.maxItems) {
    manifests.splice(options.maxItems - manifests.length);
  }

  // Store the updated manifests in local storage
  chrome.storage.local.set({ videoManifests: manifests });
  console.log('Video manifest inserted/updated', uniqueId);

  return manifests;
}

async function fetchApiData (url, subrequestParams) {
  if (!url) {
    console.error('No URL provided for fetching API data');
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

  // Fetch the response body to extract the VTT URL
  const data = await fetch(fetchUrl);
  const dataJson = await data.json();

  return dataJson;
}

// Update the initializeListeners function to include new options
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
      console.log('Potential video URL detected:', details.url);
    }

    // Check if URL contains any of the transcript keywords
    if (matchesAnyKeywords(details.url, options.transcriptKeywords) &&
      !matchesAnyKeywords(details.url, options.subrequestParams)) {
      console.log('Potential transcript URL detected:', details.url);
    }
  }, { urls: options.domains }, []);

  // Listen for web requests to catch video manifest URLs
  chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
      if (containsAnySubrequestParams(details.url, options.subrequestParams)) {
        return; // Skip if URL already contains subrequest parameters
      }

      // Extract the base URL without query parameters
      const urlWithoutParams = details.url.split('?')[0];

      // Check if URL matches any of the video keywords
      if (matchesAnyKeywords(urlWithoutParams, options.videoKeywords) ||
        matchesAnyKeywords(details.url, options.videoKeywords)) {

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

        const activeTab = await getActiveTab();
        const documentTitle = await executeScriptInTab(activeTab.id, () => document.title) || activeTab.title || 'video.mp4';
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

        console.log('FFMPEG Command:', ffmpegCommand);

        // Store the video information
        const videoInfo = {
          title: fileName,
          url: modifiedUrl,
          uniqueId: extractVideoUniqueId(modifiedUrl),
          ffmpegCommand: ffmpegCommand,
          timestamp: new Date().getTime()
        };

        const manifests = await createOrUpdateVideoManifest(videoInfo);

        if (options.notifyOnDetection && manifests !== null) {
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Sharepoint Video Detected',
            message: `Found: ${fileName}`
          });
        }
      }

      // Check if URL matches any of the transcript keywords
      if (matchesAnyKeywords(details.url, options.transcriptKeywords)) {

        console.log('Potential subtitle request detected:', details.url);

        try {
          const transcriptJson = await fetchApiData(details.url, options.subrequestParams);
          if (transcriptJson && transcriptJson.media && transcriptJson.media.transcripts &&
            transcriptJson.media.transcripts.length > 0) {

            // Extract VTT URL from the response
            const transcript = transcriptJson.media.transcripts.find(t =>
              t.transcriptType === "subtitle" && t.temporaryDownloadUrl);

            if (transcript && transcript.temporaryDownloadUrl) {
              console.log('Found VTT URL:', transcript.temporaryDownloadUrl);

              // Store the subtitle info with the video ID
              const subtitleInfo = {
                subtitleUrl: transcript.temporaryDownloadUrl,
                subtitleLanguage: transcript.languageTag || 'en-US',
                timestamp: new Date().getTime(),
                uniqueId: extractTranscriptUniqueId(details.url)
              };

              await createOrUpdateVideoManifest(subtitleInfo);
              console.log('Added subtitle URL to existing video');
            }
          }
        } catch (error) {
          console.error('Error fetching subtitle data:', error);
        }
      }

      // Check if URL matches any of the transcript json keywords
      if (containsAllRequiredSubstrings(details.url, ['transcripts', 'streamContent'])) {
        console.log('Potential transcript JSON request detected:', details.url);
        try {
          const transcriptJson = await fetchApiData(details.url, options.subrequestParams);
          let result = []
          let speakerId = null
          transcriptJson.entries.forEach(item => {
            if (item.speakerId !== speakerId) {
              result.push(item.speakerDisplayName)
              speakerId = item.speakerId
            }

            result.push(`\t${item.text}`)
          })

          const transcriptText = result.join('\r\n');
          // Store the transcript info with the video ID
          const transcriptInfo = {
            transcriptText: transcriptText,
            transcriptJsonUrl: details.url,
            timestamp: new Date().getTime(),
            uniqueId: extractUrlPathToken(details.url, 'items')
          };
          await createOrUpdateVideoManifest(transcriptInfo);
          console.log('Added transcript JSON to existing video');
        } catch (error) {
          console.error('Error fetching transcript JSON data:', error);

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
    console.error("Error: 'mainString' must be a string.");
    return false;
  }

  if (!Array.isArray(requiredSubstrings)) {
    console.error("Error: 'requiredSubstrings' must be an array.");
    return false;
  }

  for (const substring of requiredSubstrings) {
    if (!mainString.includes(substring)) {
      return false;
    }
  }

  return true;
}

// Helper function to check if a URL matches any of the keywords
function matchesAnyKeywords (url, keywords) {
  const lowerUrl = url.toLowerCase();
  return keywords.some(keyword => lowerUrl.includes(keyword.toLowerCase()));
}

// Alias for backward compatibility
function matchesVideoKeywords (url, keywords) {
  return matchesAnyKeywords(url, keywords);
}

// Helper function to check if URL already contains any of the subrequest parameters
function containsAnySubrequestParams (url, params) {
  const lowerUrl = url.toLowerCase();
  return params.some(param => lowerUrl.includes(param.toLowerCase()));
}

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
chrome.storage.onChanged.addListener(async function (changes, namespace) {
  if (namespace === 'sync' &&
    (changes.domains ||
      changes.videoKeywords ||
      changes.removeParams ||
      changes.transcriptKeywords ||
      changes.subrequestParams)) {
    console.log('Options changed, reloading listeners');

    // Remove existing listeners
    chrome.webRequest.onBeforeRequest.removeListener();

    // Re-initialize with new options
    await initializeListeners();
  }
});
