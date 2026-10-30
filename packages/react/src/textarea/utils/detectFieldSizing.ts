let supportsFieldSizing: boolean | undefined;

/**
 * Detects whether the browser supports the CSS `field-sizing: content` property.
 * Result is cached after first call.
 */
export function detectFieldSizing(): boolean {
  if (supportsFieldSizing !== undefined) {
    return supportsFieldSizing;
  }

  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    supportsFieldSizing = false;
    return supportsFieldSizing;
  }

  supportsFieldSizing = CSS.supports('field-sizing', 'content');
  return supportsFieldSizing;
}
