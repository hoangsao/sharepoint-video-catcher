/**
 * Sharepoint Video Catcher - Import Utilities
 * 
 * Utility functions to help with script imports in Chrome extensions.
 * Provides functions to safely import scripts without duplicates.
 * 
 * @author Sharepoint Video Catcher Team
 * @version 1.0.0
 * @license MIT
 */

/**
 * Keep track of imported scripts to prevent duplicates
 * @type {Object.<string, boolean>}
 */
const _importedScripts = {};

/**
 * Safely imports a script if it hasn't been imported already.
 * Works in both service worker context (using importScripts) and
 * regular browser context (using dynamic script loading).
 * 
 * @param {string} scriptPath - Path to the script to import
 * @param {Function} [onError] - Optional error handler
 * @returns {Promise<boolean>} - Promise resolving to true if script was imported or already exists, false if import failed
 */
function safeImport(scriptPath, onError) {
  // Return a promise for consistent usage across contexts
  return new Promise((resolve) => {
    const context = typeof window !== 'undefined' ? window : 
                  (typeof self !== 'undefined' ? self : null);
    
    if (!context) {
      console.error('No valid context found for imports');
      resolve(false);
      return;
    }
    
    // Check if already imported
    if (_importedScripts[scriptPath]) {
      resolve(true);
      return;
    }
    
    // Check for global flag if it exists (for backward compatibility)
    const flagName = `_${scriptPath.split('.')[0].toUpperCase()}_LOADED`;
    if (context[flagName]) {
      _importedScripts[scriptPath] = true;
      resolve(true);
      return;
    }
    
    // Service worker context - use importScripts
    if (typeof importScripts === 'function') {
      try {
        importScripts(scriptPath);
        _importedScripts[scriptPath] = true;
        resolve(true);
      } catch (e) {
        console.error(`Failed to load ${scriptPath} via importScripts:`, e);
        if (typeof onError === 'function') {
          onError(e);
        }
        resolve(false);
      }
      return;
    }
    
    // Browser context - use dynamic script loading
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.src = scriptPath;
      script.type = 'text/javascript';
      
      script.onload = () => {
        _importedScripts[scriptPath] = true;
        resolve(true);
      };
      
      script.onerror = (e) => {
        console.error(`Failed to load ${scriptPath} via dynamic script:`, e);
        if (typeof onError === 'function') {
          onError(e);
        }
        resolve(false);
      };
      
      document.head.appendChild(script);
      return;
    }
    
    // No valid import method found
    console.error(`No valid import method found for ${scriptPath}`);
    resolve(false);
  });
}

// Export for use in module contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { safeImport };
}
