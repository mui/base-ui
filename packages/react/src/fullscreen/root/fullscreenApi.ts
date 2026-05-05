import type { FullscreenNavigationUI } from './useFullscreenRoot';

// Older Safari (and some embedded WebKit views) only expose the prefixed
// Fullscreen API. The non-prefixed variants are tried first, then the prefixed
// fallbacks. The shapes below describe the legacy surface we support.
interface PrefixedDocument extends Document {
  webkitFullscreenElement?: Element | null | undefined;
  webkitFullscreenEnabled?: boolean | undefined;
  webkitExitFullscreen?: (() => Promise<void> | void) | undefined;
}

interface PrefixedElement extends HTMLElement {
  webkitRequestFullscreen?: ((options?: FullscreenOptions) => Promise<void> | void) | undefined;
}

/**
 * Event names that fire on the document when the active fullscreen element changes.
 * The container subscribes to all of them so prefixed implementations work too.
 */
export const FULLSCREEN_CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

/**
 * Event names that fire on the document when a fullscreen request is rejected.
 */
export const FULLSCREEN_ERROR_EVENTS = ['fullscreenerror', 'webkitfullscreenerror'] as const;

/**
 * Returns the element currently presented in fullscreen for the given document,
 * or `null` if none is active.
 */
export function getFullscreenElement(doc: Document): Element | null {
  const prefixed = doc as PrefixedDocument;
  return doc.fullscreenElement ?? prefixed.webkitFullscreenElement ?? null;
}

/**
 * Returns whether the Fullscreen API is enabled for the given document.
 * Mirrors `Document.fullscreenEnabled` with a webkit fallback.
 */
export function isFullscreenEnabled(doc: Document): boolean {
  const prefixed = doc as PrefixedDocument;
  if (typeof doc.fullscreenEnabled === 'boolean') {
    return doc.fullscreenEnabled;
  }
  if (typeof prefixed.webkitFullscreenEnabled === 'boolean') {
    return prefixed.webkitFullscreenEnabled;
  }
  return false;
}

/**
 * Requests fullscreen for `element`, normalizing the return value to a Promise.
 * Returns `null` when the API is unavailable on the element.
 */
export function requestElementFullscreen(
  element: HTMLElement,
  navigationUI: FullscreenNavigationUI,
): Promise<void> | null {
  const options: FullscreenOptions = { navigationUI };
  const prefixed = element as PrefixedElement;
  if (typeof element.requestFullscreen === 'function') {
    return Promise.resolve(element.requestFullscreen(options));
  }
  if (typeof prefixed.webkitRequestFullscreen === 'function') {
    // The prefixed API does not accept `FullscreenOptions`.
    const result = prefixed.webkitRequestFullscreen();
    return result instanceof Promise ? result : Promise.resolve();
  }
  return null;
}

/**
 * Exits fullscreen on the given document, normalizing the return value to a Promise.
 * Returns `null` when no fullscreen exit API is available.
 */
export function exitDocumentFullscreen(doc: Document): Promise<void> | null {
  const prefixed = doc as PrefixedDocument;
  if (getFullscreenElement(doc) == null) {
    return null;
  }
  if (typeof doc.exitFullscreen === 'function') {
    return Promise.resolve(doc.exitFullscreen());
  }
  if (typeof prefixed.webkitExitFullscreen === 'function') {
    const result = prefixed.webkitExitFullscreen();
    return result instanceof Promise ? result : Promise.resolve();
  }
  return null;
}
