// Options page for Sharepoint Video Catcher

// Default values
const defaultOptions = {
  domains: [
    "*://*.sharepoint.com/*", 
    "*://*.svc.ms/*"
  ],
  removeParams: ["enableCdn"],
  videoKeywords: ["videomanifest"],
  transcriptKeywords: ["select=media/transcripts", "select=media%2Ftranscripts"],
  subrequestParams: ["subRequest=true", "isCustomized=true"],
  fileExtension: '.mp4',
  ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"',
  maxItems: 20,
  notifyOnDetection: false
};

// Load saved options
function loadOptions() {
  chrome.storage.sync.get(defaultOptions, function(options) {
    document.getElementById('domains').value = options.domains.join('\n');
    document.getElementById('removeParams').value = options.removeParams.join('\n');
    document.getElementById('videoKeywords').value = options.videoKeywords.join('\n');
    document.getElementById('transcriptKeywords').value = options.transcriptKeywords.join('\n');
    document.getElementById('subrequestParams').value = options.subrequestParams.join('\n');
    document.getElementById('fileExtension').value = options.fileExtension;
    document.getElementById('ffmpegTemplate').value = options.ffmpegTemplate;
    document.getElementById('maxItems').value = options.maxItems;
    document.getElementById('notifyOnDetection').checked = options.notifyOnDetection;
  });
}

// Save options
function saveOptions() {
  const domains = document.getElementById('domains').value.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const removeParams = document.getElementById('removeParams').value.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const videoKeywords = document.getElementById('videoKeywords').value.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const transcriptKeywords = document.getElementById('transcriptKeywords').value.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const subrequestParams = document.getElementById('subrequestParams').value.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const options = {
    domains: domains,
    removeParams: removeParams,
    videoKeywords: videoKeywords,
    transcriptKeywords: transcriptKeywords,
    subrequestParams: subrequestParams,
    fileExtension: document.getElementById('fileExtension').value,
    ffmpegTemplate: document.getElementById('ffmpegTemplate').value,
    maxItems: parseInt(document.getElementById('maxItems').value, 10),
    notifyOnDetection: document.getElementById('notifyOnDetection').checked
  };

  chrome.storage.sync.set(options, function() {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    status.style.color = 'green';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// Add event listeners for Enter key on input fields
const inputFields = document.querySelectorAll('input[type="text"], input[type="number"]');
inputFields.forEach(input => {
  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveOptions();
    }
  });
});
