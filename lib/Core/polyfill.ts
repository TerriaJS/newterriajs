import "core-js/features/promise";

/**
 * Loads a polyfill suite from polyfill.io and then calls the provided
 * callback when it is ready
 */
function polyfill(callback: any) {
  callback();
}

module.exports = polyfill;
