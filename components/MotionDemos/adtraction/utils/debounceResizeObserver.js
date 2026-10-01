/**
 * Debounce utility for ResizeObserver callbacks to prevent infinite loops
 * that cause "ResizeObserver loop completed with undelivered notifications" errors
 */

let debounceTimeout = null;
const debounceDelay = 16; // ~1 frame at 60fps

/**
 * Creates a debounced version of a ResizeObserver callback
 * @param {Function} callback - The original callback function
 * @param {number} delay - Debounce delay in milliseconds (default: 16ms)
 * @returns {Function} - Debounced callback function
 */
export function debounceResizeCallback(callback, delay = debounceDelay) {
  return (...args) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      try {
        callback(...args);
      } catch (error) {
        // Silently catch ResizeObserver loop errors to prevent console spam
        if (!error.message.includes("ResizeObserver loop completed")) {
          console.error("ResizeObserver callback error:", error);
        }
      }
      debounceTimeout = null;
    }, delay);
  };
}

/**
 * Creates a ResizeObserver with a debounced callback
 * @param {Function} callback - The callback function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {ResizeObserver} - ResizeObserver instance with debounced callback
 */
export function createDebouncedResizeObserver(callback, delay = debounceDelay) {
  return new ResizeObserver(debounceResizeCallback(callback, delay));
}
