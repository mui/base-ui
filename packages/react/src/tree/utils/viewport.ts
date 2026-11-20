import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement, contains } from '@base-ui/utils/shadowDom';
import type { TreeItemId } from '../store/types';
import { getVerticalScale } from './getVerticalScale';

/**
 * The geometry of the mounted list, which the tree brings rows into view with.
 */
export interface TreeViewport {
  /** The height of the row of `itemId`, or `0` while it can't be measured. */
  getRowHeight: (itemId: TreeItemId) => number;
  /** The height of the scroll container's visible area. */
  getScrollportHeight: () => number;
  /** Scrolls the row of `itemId` into view along the vertical axis. */
  scrollToItem: (itemId: TreeItemId) => void;
  /** Scrolls an element inside a row into view along the horizontal axis. */
  scrollIntoViewHorizontally: (element: HTMLElement) => void;
}

/** How many rows of `rowHeight` fit in `height`: at least one, or `0` while unmeasured. */
export function getRowsPerPage(height: number, rowHeight: number): number {
  return rowHeight > 0 ? Math.max(1, Math.floor(height / rowHeight)) : 0;
}

/** Whether `element` is the document's scroller, whose scroll events fire on the document. */
export function isDocumentScroller(element: Element): boolean {
  const doc = ownerDocument(element);
  return element === doc.scrollingElement || element === doc.documentElement;
}

/**
 * Scrolls `container` just far enough along one axis for `element` to be
 * visible, aligning it with the nearest edge.
 *
 * It reads live bounding rects rather than walking the `offsetParent` chain, so
 * it stays correct when the container isn't positioned and when inner scroll
 * containers between it and `element` are scrolled. The page scroller's
 * scrollport is the viewport.
 *
 * `pending` is how far, in client pixels, inner containers are still going to
 * move `element` toward the start: a smooth scroll hasn't moved it yet.
 * Returns how far this call is still going to move `element` toward the start,
 * beyond what its live position already reflects.
 */
export function scrollIntoContainerView(
  container: HTMLElement,
  element: HTMLElement | null,
  orientation: 'horizontal' | 'vertical',
  pending = 0,
): number {
  if (element == null) {
    return 0;
  }
  const vertical = orientation === 'vertical';
  const isPage = isDocumentScroller(container);
  const containerRect = container.getBoundingClientRect();
  let scale: number;
  if (isPage) {
    scale = 1;
  } else if (vertical) {
    scale = getVerticalScale(container, containerRect);
  } else {
    scale = container.offsetWidth > 0 ? containerRect.width / container.offsetWidth : 1;
  }
  if (scale === 0) {
    return 0;
  }
  const styles = ownerWindow(container).getComputedStyle(container);
  const paddingStart =
    (parseFloat(vertical ? styles.scrollPaddingTop : styles.scrollPaddingLeft) || 0) * scale;
  const paddingEnd =
    (parseFloat(vertical ? styles.scrollPaddingBottom : styles.scrollPaddingRight) || 0) * scale;
  // The scrollport excludes the container's borders and scrollbars.
  let scrollportStart: number;
  if (isPage) {
    scrollportStart = 0;
  } else if (vertical) {
    scrollportStart = containerRect.top + container.clientTop * scale;
  } else {
    scrollportStart = containerRect.left + container.clientLeft * scale;
  }
  // The page's scrollport is the viewport, which `documentElement` measures.
  const scrollportBox = isPage ? ownerDocument(container).documentElement : container;
  const scrollportEnd =
    scrollportStart + (vertical ? scrollportBox.clientHeight : scrollportBox.clientWidth) * scale;
  const elementRect = element.getBoundingClientRect();
  const elementStyles = ownerWindow(element).getComputedStyle(element);
  const marginStart =
    parseFloat(vertical ? elementStyles.scrollMarginTop : elementStyles.scrollMarginLeft) || 0;
  const marginEnd =
    parseFloat(vertical ? elementStyles.scrollMarginBottom : elementStyles.scrollMarginRight) || 0;

  const startGap =
    (vertical ? elementRect.top : elementRect.left) -
    pending -
    marginStart -
    (scrollportStart + paddingStart);
  const endGap =
    (vertical ? elementRect.bottom : elementRect.right) -
    pending +
    marginEnd -
    (scrollportEnd - paddingEnd);

  // Align to the nearest edge, preferring the start when the element is larger
  // than the visible band (matches native `scroll-into-view` "nearest" behavior).
  let delta = 0;
  if (startGap < 0) {
    delta = startGap;
  } else if (endGap > 0) {
    delta = endGap;
  }
  if (delta === 0) {
    return 0;
  }
  // Under `scroll-behavior: smooth` the assignment animates, so the target is
  // computed, clamped to the scroll range, and compared with the position read
  // back: an immediate scroll leaves nothing pending.
  const scrollSize = vertical
    ? container.scrollHeight - scrollportBox.clientHeight
    : container.scrollWidth - scrollportBox.clientWidth;
  // RTL horizontal scrolling runs from `-scrollSize` to `0`.
  const rtl = !vertical && styles.direction === 'rtl';
  const min = rtl ? -scrollSize : 0;
  const max = rtl ? 0 : scrollSize;
  const current = vertical ? container.scrollTop : container.scrollLeft;
  const next = current + delta / scale;
  if (vertical) {
    container.scrollTop = next;
  } else {
    container.scrollLeft = next;
  }
  const target = Math.min(Math.max(next, min), Math.max(min, max));
  return (target - (vertical ? container.scrollTop : container.scrollLeft)) * scale;
}

/**
 * Scrolls `containers`, nearest first, just far enough along one axis for
 * `element` to be visible. The outer ones, such as the page, only scroll while
 * focus is inside `element`: a tree whose own scroll container runs past the
 * window would otherwise leave the focused row off screen.
 */
export function scrollIntoContainersView(
  containers: HTMLElement[],
  element: HTMLElement | null,
  orientation: 'horizontal' | 'vertical',
): void {
  if (element == null || containers.length === 0) {
    return;
  }
  let pending = scrollIntoContainerView(containers[0], element, orientation);
  if (!contains(element, activeElement(ownerDocument(element)))) {
    return;
  }
  for (let i = 1; i < containers.length; i += 1) {
    pending += scrollIntoContainerView(containers[i], element, orientation, pending);
  }
}
