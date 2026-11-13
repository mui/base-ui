import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getComposedParentElement } from '../../utils/popups/focus/tabbable';

function isScrollable(element: HTMLElement): boolean {
  const style = ownerWindow(element).getComputedStyle(element);
  if (style.overflowY === 'hidden') {
    return false;
  }
  return (
    style.overflowY === 'auto' ||
    style.overflowY === 'scroll' ||
    style.overflowX === 'auto' ||
    style.overflowX === 'scroll'
  );
}

/**
 * Walks up the DOM from `start` and returns the nearest ancestor that
 * reports an `overflow` of `auto` / `scroll`, crossing shadow-root
 * boundaries. Falls back to the document's scrolling element if none is
 * found.
 */
export function findScrollContainer(start: HTMLElement): HTMLElement {
  const doc = ownerDocument(start);
  let current: HTMLElement | null = start;
  while (current && current !== doc.documentElement) {
    if (isScrollable(current)) {
      return current;
    }
    const parent = getComposedParentElement(current);
    current = parent instanceof ownerWindow(current).HTMLElement ? parent : null;
  }
  return (doc.scrollingElement as HTMLElement | null) ?? doc.documentElement;
}
