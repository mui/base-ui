import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getComposedParentElement } from '../../utils/popups/focus/tabbable';
import { isDocumentScroller } from './viewport';

type Axis = 'horizontal' | 'vertical';

function isScrollable(element: HTMLElement, axis: Axis): boolean {
  const style = ownerWindow(element).getComputedStyle(element);
  const overflow = axis === 'vertical' ? style.overflowY : style.overflowX;
  return overflow === 'auto' || overflow === 'scroll';
}

/**
 * Walks up the DOM from `start` and returns the nearest ancestor that
 * reports an `overflow` of `auto` / `scroll` along `axis`, crossing
 * shadow-root boundaries. Falls back to the document's scrolling element if
 * none is found.
 */
export function findScrollContainer(start: HTMLElement, axis: Axis = 'vertical'): HTMLElement {
  const doc = ownerDocument(start);
  let current: HTMLElement | null = start;
  while (current && current !== doc.documentElement) {
    if (isScrollable(current, axis)) {
      return current;
    }
    const parent = getComposedParentElement(current);
    current = parent instanceof ownerWindow(current).HTMLElement ? parent : null;
  }
  return (doc.scrollingElement as HTMLElement | null) ?? doc.documentElement;
}

/**
 * The scroll containers along `axis` around `start`, from the nearest one out
 * to the document's scrolling element.
 */
export function findScrollContainers(start: HTMLElement, axis: Axis = 'vertical'): HTMLElement[] {
  let container = findScrollContainer(start, axis);
  const containers = [container];
  while (!isDocumentScroller(container)) {
    const parent = getComposedParentElement(container);
    if (!(parent instanceof ownerWindow(container).HTMLElement)) {
      break;
    }
    container = findScrollContainer(parent, axis);
    containers.push(container);
  }
  return containers;
}
