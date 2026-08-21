import { ownerWindow } from './owner';

/**
 * Checks if a value is an HTMLElement, including elements from other iframes/realms.
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  if (typeof window === 'undefined' || value == null) {
    return false;
  }
  if (value instanceof HTMLElement) {
    return true;
  }
  // Cross-realm: must be an element node (nodeType 1) from another window.
  // The try/catch guards against detached/destroyed windows where accessing
  // `.HTMLElement` on the owner window may throw.
  try {
    return (
      (value as Node).nodeType === 1 &&
      value instanceof (ownerWindow(value as Node) as Window & typeof globalThis).HTMLElement
    );
  } catch {
    return false;
  }
}
