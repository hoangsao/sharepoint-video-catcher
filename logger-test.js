/**
 * This file contains tests for the enhanced logger.
 * It demonstrates the various log levels and formatting.
 * 
 * To use this test:
 * 1. Enable debug logging in the extension options
 * 2. Set the desired log level
 * 3. Call loggerTest() from the browser console
 */

/**
 * Tests all logger methods at different log levels
 */
function loggerTest() {
  // Create a test logger
  const testLogger = new Logger('LoggerTest');
  testLogger.setEnabled(true);
  testLogger.setLevel(LogLevel.DEBUG);
  
  // Log the current settings
  testLogger.info('Logger test started');
  testLogger.info('Current log level:', testLogger.getLevelName(testLogger.getLevel()));
  testLogger.info('Enabled status:', testLogger.enabled);
  
  // Test each log level
  testLogger.group('Testing all log methods', () => {
    testLogger.debug('This is a debug message');
    testLogger.info('This is an info message');
    testLogger.warn('This is a warning message');
    testLogger.error('This is an error message');
  });
  
  // Test with objects
  const testObject = {
    name: 'Test Object',
    level: 'Debug',
    nested: {
      value: 42,
      active: true
    }
  };
  
  testLogger.group('Testing with complex objects', () => {
    testLogger.debug('Object test:', testObject);
    testLogger.info('Current timestamp:', new Date());
    testLogger.warn('Warning with array:', [1, 2, 3, 'test']);
  });
  
  // Test different log levels
  const originalLevel = testLogger.getLevel();
  
  testLogger.group('Testing different log levels', () => {
    // Log at ERROR level
    testLogger.info('----------ERROR level----------');
    testLogger.info('Changing to ERROR level');
    testLogger.setLevel(LogLevel.ERROR);
    testLogger.debug('This debug message should NOT appear');
    testLogger.info('This info message should NOT appear');
    testLogger.warn('This warning message should NOT appear');
    testLogger.error('This error message should appear');
    
    // Log at WARN level
    testLogger.info('----------WARN level----------');
    testLogger.info('Changing to WARN level');
    testLogger.setLevel(LogLevel.WARN);
    testLogger.debug('This debug message should NOT appear');
    testLogger.info('This info message should NOT appear');
    testLogger.warn('This warning message should appear');
    testLogger.error('This error message should appear');
    
    // Log at INFO level
    testLogger.info('----------INFO level----------');
    testLogger.info('Changing to INFO level');
    testLogger.setLevel(LogLevel.INFO);
    testLogger.debug('This debug message should NOT appear');
    testLogger.info('This info message should appear');
    testLogger.warn('This warning message should appear');
    testLogger.error('This error message should appear');
    
    // Log at DEBUG level
    testLogger.info('----------DEBUG level----------');
    testLogger.info('Changing to DEBUG level');
    testLogger.setLevel(LogLevel.DEBUG);
    testLogger.debug('This debug message should appear');
    testLogger.info('This info message should appear');
    testLogger.warn('This warning message should appear');
    testLogger.error('This error message should appear');
    
    // Restore original level
    testLogger.setLevel(originalLevel);
    testLogger.info('Restored to original log level:', testLogger.getLevelName(testLogger.getLevel()));
  });
  
  // Test disabling the logger
  testLogger.group('Testing disabled logger', () => {
    testLogger.info('Disabling logger');
    testLogger.setEnabled(false);
    testLogger.debug('This debug message should NOT appear');
    testLogger.info('This info message should NOT appear');
    testLogger.warn('This warning message should NOT appear');
    testLogger.error('This error message should NOT appear');
    
    // Re-enable
    testLogger.setEnabled(true);
    testLogger.info('Logger re-enabled');
  });
  
  testLogger.info('Logger test completed');
}

// Export for testing
if (typeof window !== 'undefined') {
  window.loggerTest = loggerTest;
}
