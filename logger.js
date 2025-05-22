/**
 * Sharepoint Video Catcher - Enhanced Logger
 * 
 * A versatile logging utility for the extension that can be enabled or disabled
 * based on configuration settings. Logs can be toggled on/off for production use
 * and have configurable log levels.
 * 
 * @author Sharepoint Video Catcher Team
 * @version 1.1.0
 * @license MIT
 */

/**
 * Log levels in order of verbosity
 * @enum {number}
 */
const LogLevel = {
  NONE: 0,    // No logging
  ERROR: 1,   // Only errors
  WARN: 2,    // Errors and warnings
  INFO: 3,    // Errors, warnings, and info
  DEBUG: 4,   // All logs
};

/**
 * Enhanced logger class that supports log levels and can be toggled on/off
 */
class Logger {
  /**
   * Creates a new Logger instance.
   * 
   * @param {string} scope - The scope/component name for this logger instance
   * @param {LogLevel} [level=LogLevel.INFO] - Initial log level
   */
  constructor(scope, level = LogLevel.INFO) {
    this.scope = scope || 'App';
    this.enabled = false;
    this.level = level;
    this.initialize();
    
    // Create timestamp formatted style for logs
    this.styles = {
      scope: 'background: #0078d4; color: white; padding: 2px 4px; border-radius: 2px;',
      info: 'color: #0078d4;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #ff5252; font-weight: bold;',
      debug: 'color: #9C27B0;'
    };
  }

  /**
   * Initializes the logger by loading configuration from storage.
   */
  async initialize() {
    try {
      const result = await chrome.storage.sync.get({ 
        debugMode: false,
        logLevel: LogLevel.INFO 
      });
      this.enabled = result.debugMode;
      this.level = result.logLevel;
      
      // Log startup info if enabled
      if (this.enabled && this.level >= LogLevel.INFO) {
        this.info(`Logger initialized with level: ${this.getLevelName(this.level)}`);
      }
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Convert numeric log level to string name
   * 
   * @param {LogLevel} level - The numeric log level
   * @returns {string} - The name of the log level
   */
  getLevelName(level) {
    return Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'UNKNOWN';
  }

  /**
   * Enables or disables logging.
   * 
   * @param {boolean} enabled - Whether logging should be enabled
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  /**
   * Sets the current log level.
   * 
   * @param {LogLevel} level - The log level to set
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Gets the current log level.
   * 
   * @returns {LogLevel} - The current log level
   */
  getLevel() {
    return this.level;
  }

  /**
   * Format the current timestamp for logging
   * 
   * @returns {string} - Formatted timestamp [HH:MM:SS.ms]
   */
  getTimestamp() {
    const now = new Date();
    return `[${now.toISOString().split('T')[1].slice(0, -1)}]`;
  }

  /**
   * Logs an informational message.
   * 
   * @param  {...any} args - Arguments to log
   */
  info(...args) {
    if (this.enabled && this.level >= LogLevel.INFO) {
      console.info(
        `%c${this.getTimestamp()} %c[${this.scope}]%c`, 
        'color: gray;', 
        this.styles.scope, 
        this.styles.info, 
        ...args
      );
    }
  }

  /**
   * Logs a warning message.
   * 
   * @param  {...any} args - Arguments to log
   */
  warn(...args) {
    if (this.enabled && this.level >= LogLevel.WARN) {
      console.warn(
        `%c${this.getTimestamp()} %c[${this.scope}]%c`, 
        'color: gray;', 
        this.styles.scope, 
        this.styles.warn, 
        ...args
      );
    }
  }

  /**
   * Logs an error message.
   * 
   * @param  {...any} args - Arguments to log
   */
  error(...args) {
    if (this.enabled && this.level >= LogLevel.ERROR) {
      console.error(
        `%c${this.getTimestamp()} %c[${this.scope}]%c`, 
        'color: gray;', 
        this.styles.scope, 
        this.styles.error, 
        ...args
      );
    }
  }

  /**
   * Logs a debug message.
   * 
   * @param  {...any} args - Arguments to log
   */
  debug(...args) {
    if (this.enabled && this.level >= LogLevel.DEBUG) {
      console.debug(
        `%c${this.getTimestamp()} %c[${this.scope}]%c`, 
        'color: gray;', 
        this.styles.scope, 
        this.styles.debug, 
        ...args
      );
    }
  }

  /**
   * Logs a message at the specified level.
   * 
   * @param {string} level - The log level ('info', 'warn', 'error', 'debug')
   * @param  {...any} args - Arguments to log
   */
  log(level, ...args) {
    switch (level.toLowerCase()) {
      case 'info':
        this.info(...args);
        break;
      case 'warn':
        this.warn(...args);
        break;
      case 'error':
        this.error(...args);
        break;
      case 'debug':
        this.debug(...args);
        break;
      default:
        this.info(...args);
    }
  }
  
  /**
   * Group logs together with a collapsible header
   * 
   * @param {string} label - The group label
   * @param {Function} callback - Function to execute within the group
   */
  group(label, callback) {
    if (!this.enabled) return;
    
    console.group(`%c${this.getTimestamp()} %c[${this.scope}]%c ${label}`, 
      'color: gray;', 
      this.styles.scope, 
      'color: inherit;'
    );
    
    try {
      callback();
    } finally {
      console.groupEnd();
    }
  }
}

// Create a global logger instance for the extension
const logger = new Logger('SharepointVideoCatcher');

/**
 * Update all loggers in the extension when settings change
 */
function updateLoggers() {
  chrome.storage.sync.get({ 
    debugMode: false,
    logLevel: LogLevel.INFO 
  }, function(options) {
    logger.setEnabled(options.debugMode);
    logger.setLevel(options.logLevel);
    logger.debug('Logger settings updated:', options.debugMode, 'level:', logger.getLevelName(options.logLevel));
  });
}

// Initialize logger settings right away
updateLoggers();

// Listen for changes to storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && (changes.debugMode || changes.logLevel)) {
    updateLoggers();
  }
});

// Export the logger and LogLevel for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { logger, LogLevel, updateLoggers };
}
