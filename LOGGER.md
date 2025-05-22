# Enhanced Logger Usage Guide

This document provides guidelines on how to use the enhanced logging system in the Sharepoint Video Catcher extension.

## Basic Usage

The logger is available in all extension scripts after importing `logger.js`. Each component should create its own logger instance:

```javascript
// Create a logger for your component
const myLogger = new Logger('ComponentName');

// Use different log levels as needed
myLogger.debug('Detailed debug information');
myLogger.info('General information');
myLogger.warn('Warning message');
myLogger.error('Error information');
```

## Log Levels

The logger supports the following log levels:

| Level | Value | Description | Usage |
|-------|-------|-------------|-------|
| NONE  | 0 | No logging | Use in production to disable all logs |
| ERROR | 1 | Only errors | Use in production for critical issues |
| WARN  | 2 | Errors and warnings | Use in production for potential issues |
| INFO  | 3 | Errors, warnings, and info | Use for general operations |
| DEBUG | 4 | All logs | Use for detailed debugging information |

## Grouping Logs

You can group related logs together for better organization:

```javascript
myLogger.group('Process X', () => {
  myLogger.info('Starting Process X');
  myLogger.debug('Detail 1');
  myLogger.debug('Detail 2');
  myLogger.info('Process X completed');
});
```

## Conditional Logging

The logger automatically checks the current log level before outputting messages:

```javascript
// This will only be logged if the log level is DEBUG (4)
myLogger.debug('Detailed variable state:', complexObject);

// This will be logged if the log level is INFO (3) or higher
myLogger.info('Operation completed successfully');
```

## Testing the Logger

You can use the built-in logger test to verify that your logging configuration is working correctly:

1. Enable debug mode in the extension options
2. Set the desired log level
3. Open the browser console
4. Run the `loggerTest()` function from the console

OR

1. Enable debug mode in the extension options
2. Click the "Test Logger" button in the options page
3. Check the browser console for results

## Production Considerations

In production environments:

1. Set `debugMode: false` to disable all logging
2. Or use a lower log level (ERROR or WARN) to only capture important messages
3. Never log sensitive information, even at DEBUG level

## Accessing Logs

When debug mode is enabled, logs can be viewed:

1. Open the browser's developer tools (F12)
2. Go to the Console tab
3. Filter by logger name (e.g., "Background") if needed
