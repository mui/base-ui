import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { scrollIntoViewIfNeeded } from '../../internals/composite';
import type { TextDirection } from '../../internals/direction-context';
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

/**
 * Scrolls `container` just far enough along one axis for `element` to be
 * visible, aligning it with the nearest edge.
 *
 * For an element scroll container, it reads live bounding rects rather than
 * walking the `offsetParent` chain, so it stays correct when the container isn't
 * positioned (and therefore isn't the element's `offsetParent`). For the page
 * scroller, offsets measured up the `offsetParent` chain already live in the
 * document's scroll coordinate space, so the shared helper is correct there.
 */
/** Whether `element` is the document's scroller, whose scroll events fire on the document. */
export function isDocumentScroller(element: Element): boolean {
  const doc = ownerDocument(element);
  return element === doc.scrollingElement || element === doc.documentElement;
}

export function scrollIntoContainerView(
  container: HTMLElement,
  element: HTMLElement | null,
  orientation: 'horizontal' | 'vertical',
  direction: TextDirection,
): void {
  if (element == null) {
    return;
  }
  if (isDocumentScroller(container)) {
    scrollIntoViewIfNeeded(container, element, direction, orientation);
    return;
  }

  const vertical = orientation === 'vertical';
  const containerRect = container.getBoundingClientRect();
  let scale: number;
  if (vertical) {
    scale = getVerticalScale(container, containerRect);
  } else {
    scale = container.offsetWidth > 0 ? containerRect.width / container.offsetWidth : 1;
  }
  if (scale === 0) {
    return;
  }
  const styles = ownerWindow(container).getComputedStyle(container);
  const paddingStart =
    (parseFloat(vertical ? styles.scrollPaddingTop : styles.scrollPaddingLeft) || 0) * scale;
  const paddingEnd =
    (parseFloat(vertical ? styles.scrollPaddingBottom : styles.scrollPaddingRight) || 0) * scale;
  // The scrollport excludes the container's borders and scrollbars.
  const scrollportStart = vertical
    ? containerRect.top + container.clientTop * scale
    : containerRect.left + container.clientLeft * scale;
  const scrollportEnd =
    scrollportStart + (vertical ? container.clientHeight : container.clientWidth) * scale;
  const elementRect = element.getBoundingClientRect();

  const startGap =
    (vertical ? elementRect.top : elementRect.left) - (scrollportStart + paddingStart);
  const endGap = (vertical ? elementRect.bottom : elementRect.right) - (scrollportEnd - paddingEnd);

  // Align to the nearest edge, preferring the start when the element is larger
  // than the visible band (matches native `scroll-into-view` "nearest" behavior).
  let delta = 0;
  if (startGap < 0) {
    delta = startGap;
  } else if (endGap > 0) {
    delta = endGap;
  }
  if (delta === 0) {
    return;
  }
  if (vertical) {
    container.scrollTop += delta / scale;
  } else {
    container.scrollLeft += delta / scale;
  }
}
