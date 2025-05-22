/**
 * Sharepoint Video Catcher - Options Page
 * 
 * This script handles the options/settings page of the extension.
 * It allows users to customize various aspects of the extension including
 * monitored domains, keyword filters, and output settings.
 * 
 * @author Sharepoint Video Catcher Team
 * @version 1.0.0
 * @license MIT
 */

// Default configuration values
const defaultOptions = {
  domains: [
    "*://*.sharepoint.com/*", 
    "*://*.svc.ms/*"
  ],  removeParams: ["enableCdn"],
  videoKeywords: ["videomanifest"],
  transcriptKeywords: ["select=media/transcripts", "select=media%2Ftranscripts"],  
  subrequestParams: ["subRequest=true", "isCustomized=true"],
  fileExtension: '.mp4',
  ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"',
  maxItems: 20,
  notifyOnDetection: false,
  debugMode: false,
  logLevel: 3 // INFO level by default (corresponds to LogLevel.INFO)
};

/**
 * Loads saved options from storage and populates the form fields.
 * If no saved options exist, default values are used.
 */
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
    document.getElementById('debugMode').checked = options.debugMode;
      // Set log level
    const logLevelSelect = document.getElementById('logLevel');
    if (logLevelSelect) {
      logLevelSelect.value = options.logLevel;
    }
    
    // Set log level container visibility based on debug mode
    const logLevelContainer = document.getElementById('logLevelContainer');
    if (logLevelContainer) {
      logLevelContainer.style.display = options.debugMode ? 'block' : 'none';
    }
  });
}

/**
 * Saves the current options from form fields to storage.
 * Provides visual feedback when options are successfully saved.
 */
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
    .filter(line => line.length > 0);    const options = {
    domains: domains,
    removeParams: removeParams,
    videoKeywords: videoKeywords,
    transcriptKeywords: transcriptKeywords,
    subrequestParams: subrequestParams,    fileExtension: document.getElementById('fileExtension').value || defaultOptions.fileExtension,
    ffmpegTemplate: document.getElementById('ffmpegTemplate').value || defaultOptions.ffmpegTemplate,
    maxItems: parseInt(document.getElementById('maxItems').value, 10) || defaultOptions.maxItems,
    notifyOnDetection: document.getElementById('notifyOnDetection').checked,
    debugMode: document.getElementById('debugMode').checked,
    logLevel: parseInt(document.getElementById('logLevel').value, 10) || defaultOptions.logLevel
  };

  // Validate options
  const isValid = validateOptions(options);
  if (!isValid.valid) {
    const status = document.getElementById('status');
    status.textContent = `Error: ${isValid.message}`;
    status.style.color = 'red';
    return;
  }

  // Save options to chrome.storage.sync
  chrome.storage.sync.set(options)
    .then(() => {
      const status = document.getElementById('status');
      status.textContent = 'Options saved successfully.';
      status.classList.add('success');
      
      setTimeout(() => {
        status.textContent = '';
        status.classList.remove('success');
      }, 2000);
    })
    .catch(error => {
      console.error('Error saving options:', error);
      const status = document.getElementById('status');
      status.textContent = 'Error saving options. Please try again.';
      status.style.color = 'red';
    });
}

/**
 * Validates the options before saving them.
 * Ensures critical options have at least default values.
 * 
 * @param {Object} options - The options object to validate
 * @returns {Object} - Object with valid (boolean) and message (string) properties
 */
function validateOptions(options) {
  if (!options.domains || options.domains.length === 0) {
    return { valid: false, message: 'At least one domain must be specified' };
  }
  
  if (!options.videoKeywords || options.videoKeywords.length === 0) {
    return { valid: false, message: 'At least one video keyword must be specified' };
  }
  
  if (!options.fileExtension) {
    return { valid: false, message: 'File extension cannot be empty' };
  }
  
  if (!options.ffmpegTemplate) {
    return { valid: false, message: 'FFMPEG template cannot be empty' };
  }
  
  // Validate log level
  if (options.logLevel === undefined || options.logLevel < 0 || options.logLevel > 4) {
    options.logLevel = 3; // Default to INFO level
  }
  
  return { valid: true, message: '' };
}

// Initialize
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// Add event listeners for Enter key on input fields and auto-save for checkboxes
document.addEventListener('DOMContentLoaded', () => {
  // Add Enter key handler for text/number inputs
  const inputFields = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
  inputFields.forEach(input => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        saveOptions();
      }
    });
  });
  
  // Help text for textarea fields - show character count
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    textarea.addEventListener('input', () => {
      const lineCount = textarea.value.split('\n').length;
      const nearestHint = textarea.nextElementSibling;
      if (nearestHint && nearestHint.classList.contains('hint')) {
        // If there are multiple lines, show a count
        if (lineCount > 1) {
          const countText = `${lineCount} items`;
          if (!nearestHint.dataset.originalText) {
            nearestHint.dataset.originalText = nearestHint.textContent;
          }
          nearestHint.textContent = `${nearestHint.dataset.originalText} (${countText})`;
        } else if (nearestHint.dataset.originalText) {
          nearestHint.textContent = nearestHint.dataset.originalText;
        }
      }
    });
  });

  // Toggle log level visibility based on debug mode
  const debugModeCheckbox = document.getElementById('debugMode');
  const logLevelContainer = document.getElementById('logLevelContainer');
  if (debugModeCheckbox && logLevelContainer) {
    // Set initial visibility
    logLevelContainer.style.display = debugModeCheckbox.checked ? 'block' : 'none';

    // Add change event listener
    debugModeCheckbox.addEventListener('change', function () {
      logLevelContainer.style.display = this.checked ? 'block' : 'none';
    });

    // Add Test Selected Level button functionality
    const testSelectedLevelButton = document.getElementById('test-selected-level');
    if (testSelectedLevelButton) {
      testSelectedLevelButton.addEventListener('click', function () {
        // Get the currently selected log level from the UI
        const selectedLogLevel = parseInt(document.getElementById('logLevel').value, 10);

        // If a selected log level was provided, use it for testing
        if (selectedLogLevel !== undefined) {
          // Create an logger
          const testLogger = new Logger('Options');
          const levelName = testLogger.getLevelName(selectedLogLevel);
          testLogger.setLevel(selectedLogLevel);
          testLogger.setEnabled(true);
          testLogger.log(levelName, `Using selected log level from UI: ${levelName}`);
        }
      });
    }

    // Add logger test button functionality
    const testLoggerButton = document.getElementById('test-logger');
    if (testLoggerButton) {
      testLoggerButton.addEventListener('click', function () {
        // Create an options logger
        const optionsLogger = new Logger('Options');
        optionsLogger.info('Running logger test from options page...');

        // Get the currently selected log level from the UI
        const selectedLogLevel = parseInt(document.getElementById('logLevel').value, 10);

        // Run the test if available, passing the currently selected log level
        if (typeof loggerTest === 'function') {
          loggerTest(selectedLogLevel);
        } else {
          optionsLogger.error('Logger test not available');
          alert('Logger test function not available. Please check the console for errors.');
        }
      });
    }
  }
});
