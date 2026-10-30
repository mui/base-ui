import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';

/**
 * Scrollable content before the first row and after the last one, in scroll coordinates: what the
 * rows are laid out inside of, and what separates the engine's coordinates from `scrollTop`.
 */
export interface RowsInset {
  start: number;
  end: number;
}

/**
 * Block padding of the scrollport, which is the inset of a list whose rows fill its scrollport.
 */
export type ScrollportPadding = RowsInset;

export const EMPTY_SCROLLPORT_PADDING: ScrollportPadding = { start: 0, end: 0 };

export function getScrollportPadding(element: HTMLElement): ScrollportPadding {
  const styles = ownerWindow(element).getComputedStyle(element);
  return {
    start: Math.max(0, Number.parseFloat(styles.paddingTop) || 0),
    end: Math.max(0, Number.parseFloat(styles.paddingBottom) || 0),
  };
}

/**
 * The scrollport's content-box height, which is the box the engine observes through its
 * `ResizeObserver`. Reading it back is how a viewport measured under a temporarily expanded
 * layout is corrected.
 */
export function getContentHeight(element: HTMLElement) {
  const padding = getScrollportPadding(element);
  return Math.max(0, element.clientHeight - padding.start - padding.end);
}

/**
 * The factor an ancestor transform — a popup mid entrance animation — scales the scrollport's
 * client rect by. Rects are in the viewport's space; scroll offsets are in layout space, and the
 * scrollport's rect against its layout height gives the factor back. That height is read from
 * computed style rather than `offsetHeight`, which rounds to whole pixels: a popup sized by its
 * positioner is rarely a whole number of pixels tall, and the rounding would read as a transform.
 * Under `content-box` the computed height is the content alone, without the padding, the borders
 * or a horizontal scrollbar that takes up space; the last two are whole pixels, so the rounded
 * difference of the two DOM heights restores them exactly.
 */
export function getLayoutScale(scrollElement: HTMLElement, scrollElementRect: DOMRect) {
  const styles = ownerWindow(scrollElement).getComputedStyle(scrollElement);
  let layoutHeight = Number.parseFloat(styles.height);
  if (styles.boxSizing !== 'border-box') {
    layoutHeight +=
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom) +
      (scrollElement.offsetHeight - scrollElement.clientHeight);
  }
  const measuredScale = scrollElementRect.height / layoutHeight;
  return Number.isFinite(measuredScale) && measuredScale > 0 ? measuredScale : 1;
}

/**
 * Where a vertical client coordinate lies in scroll coordinates: from the scrollport's padding
 * edge, at its current scroll position.
 */
export function toScrollOffset(
  clientY: number,
  scrollElement: HTMLElement,
  scrollElementRect: DOMRect,
  scale: number,
) {
  return (
    (clientY - scrollElementRect.top) / scale - scrollElement.clientTop + scrollElement.scrollTop
  );
}

/**
 * A reader of scroll offsets for the scrollport's current position and scale, for a caller with
 * several client coordinates to convert at once.
 */
export function createScrollOffsetReader(scrollElement: HTMLElement) {
  const scrollElementRect = scrollElement.getBoundingClientRect();
  const scale = getLayoutScale(scrollElement, scrollElementRect);
  return (clientY: number) => toScrollOffset(clientY, scrollElement, scrollElementRect, scale);
}

/**
 * The nearest ancestor with a vertical scrolling mechanism of its own, which is the scroll
 * container `position: sticky` descendants stick to as well, or `null` when there is none short
 * of the document. Crosses shadow roots. The document's own scrolling is not an element's: its
 * scroll events reach the document rather than `<html>` or `<body>`, whichever of the two the
 * viewport takes its overflow from.
 */
export function findScrollContainer(element: HTMLElement): HTMLElement | null {
  const win = ownerWindow(element);
  const body = ownerDocument(element).body;

  for (
    let ancestor = getParentElement(element);
    ancestor != null && ancestor !== body;
    ancestor = getParentElement(ancestor)
  ) {
    const { overflowY } = win.getComputedStyle(ancestor);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return ancestor;
    }
  }

  return null;
}

const DOCUMENT_FRAGMENT_NODE = 11;
const ELEMENT_NODE = 1;

function getParentElement(node: Node): HTMLElement | null {
  const parent = node.parentNode;

  if (parent == null) {
    return null;
  }

  // The children of a shadow root have no parent element; continue from the root's host.
  if (parent.nodeType === DOCUMENT_FRAGMENT_NODE) {
    return ((parent as ShadowRoot).host as HTMLElement | undefined) ?? null;
  }

  return parent.nodeType === ELEMENT_NODE ? (parent as HTMLElement) : null;
}
