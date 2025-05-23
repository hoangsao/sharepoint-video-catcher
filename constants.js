/**
 * Sharepoint Video Catcher - Constants
 * 
 * Centralized constants for the extension. This file contains all the predefined
 * values and configuration defaults used throughout the extension.
 * 
 * @author Sharepoint Video Catcher Team
 * @version 1.0.0
 * @license MIT
 */

// Set a global flag to indicate this script has been loaded
// This helps prevent duplicate imports
if (typeof window !== 'undefined') {
  window._CONSTANTS_LOADED = true;
} else if (typeof self !== 'undefined') {
  self._CONSTANTS_LOADED = true;
}

/**
 * Log levels in order of verbosity
 * @enum {number}
 */
const LOG_LEVELS = {
  NONE: 0,    // No logging
  ERROR: 1,   // Only errors
  WARN: 2,    // Errors and warnings
  INFO: 3,    // Errors, warnings, and info
  DEBUG: 4,   // All logs
};

/**
 * Default extension configuration
 */
const DEFAULT_OPTIONS = {
  // Domains to monitor for video and transcript requests
  domains: [
    "*://*.sharepoint.com/*", 
    "*://*.svc.ms/*"
  ],
  
  // Parameters to remove from video URLs
  removeParams: ["enableCdn"],
  
  // Keywords that identify video manifest URLs
  videoKeywords: ["videomanifest"],
  
  // Keywords that identify transcript URLs
  transcriptKeywords: [
    "select=media/transcripts", 
    "select=media%2Ftranscripts"
  ],
  
  // Parameters to add to API requests
  subrequestParams: [
    "subRequest=true", 
    "isCustomized=true"
  ],
  
  // Default file extension for downloaded videos
  fileExtension: '.mp4',
  
  // Template for ffmpeg command
  ffmpegTemplate: 'ffmpeg -i "{url}" -codec copy "{filename}"',
  
  // Maximum number of items to store in history
  maxItems: 20,
  
  // Whether to show notifications on video detection
  notifyOnDetection: false,
  
  // Debug mode setting
  debugMode: false,
  
  // Default log level (INFO)
  logLevel: LOG_LEVELS.INFO
};

/**
 * Time constants in milliseconds
 */
const TIME_CONSTANTS = {
  // KeepAlive ping interval (45 seconds)
  KEEPALIVE_INTERVAL: 45000,
  
  // Auto-stop timeout for keepAlive (90 seconds)
  AUTOSTOP_TIMEOUT: 90000,
  
  // Force-stop timeout for extended inactivity (5 minutes)
  FORCE_STOP_TIMEOUT: 300000,
  
  // Health check interval for listeners (5 minutes)
  HEALTH_CHECK_INTERVAL: 300000
};

/**
 * UI-related constants
 */
const UI_CONSTANTS = {
  // Timeout for UI feedback messages (1.5 seconds)
  FEEDBACK_TIMEOUT: 1500
};

/**
 * Default filenames and values
 */
const DEFAULTS = {
  // Default filename for videos when extraction fails
  VIDEO_FILENAME: 'video.mp4'
};

// Export constants for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    LOG_LEVELS, 
    DEFAULT_OPTIONS, 
    TIME_CONSTANTS,
    UI_CONSTANTS,
    DEFAULTS
  };
}