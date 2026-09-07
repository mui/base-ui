import { ownerWindow } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';

interface ElementBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Tolerance around the element bounds so a fast click whose pointer drifts slightly
// during press-release isn't mistaken for a drag-off-and-release cancellation.
// Matches typical OS/browser drag-initiation thresholds.
const BOUNDARY_OFFSET = 5;

/**
 * Determines if a mouse event occurred within the bounds of an element
 * (including its pseudo-elements), with a small tolerance for pointer drift.
 */
export function isMouseWithinBounds(event: MouseEvent, element: HTMLElement): boolean {
  const bounds = getPseudoElementBounds(element);

  return (
    event.clientX >= bounds.left - BOUNDARY_OFFSET &&
    event.clientX <= bounds.right + BOUNDARY_OFFSET &&
    event.clientY >= bounds.top - BOUNDARY_OFFSET &&
    event.clientY <= bounds.bottom + BOUNDARY_OFFSET
  );
}

export function getPseudoElementBounds(element: HTMLElement): ElementBounds {
  const elementRect = element.getBoundingClientRect();
  const win = ownerWindow(element);

  // Avoid "Not implemented: window.getComputedStyle(elt, pseudoElt)" in jsdom.
  if (platform.env.jsdom) {
    return elementRect;
  }

  const beforeStyles = win.getComputedStyle(element, '::before');
  const afterStyles = win.getComputedStyle(element, '::after');

  const hasPseudoElements = beforeStyles.content !== 'none' || afterStyles.content !== 'none';

  if (!hasPseudoElements) {
    return elementRect;
  }

  // Get dimensions of pseudo-elements
  const beforeWidth = parseFloat(beforeStyles.width) || 0;
  const beforeHeight = parseFloat(beforeStyles.height) || 0;
  const afterWidth = parseFloat(afterStyles.width) || 0;
  const afterHeight = parseFloat(afterStyles.height) || 0;

  // Calculate max dimensions including pseudo-elements
  const totalWidth = Math.max(elementRect.width, beforeWidth, afterWidth);
  const totalHeight = Math.max(elementRect.height, beforeHeight, afterHeight);

  // Calculate the differences to extend the bounds
  const widthDiff = totalWidth - elementRect.width;
  const heightDiff = totalHeight - elementRect.height;

  return {
    left: elementRect.left - widthDiff / 2,
    right: elementRect.right + widthDiff / 2,
    top: elementRect.top - heightDiff / 2,
    bottom: elementRect.bottom + heightDiff / 2,
  };
}
