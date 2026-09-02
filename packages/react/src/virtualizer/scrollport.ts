import { ownerWindow } from '@base-ui/utils/owner';

/**
 * Block padding of the scrollport, which the rows are laid out inside of.
 */
export interface ScrollportPadding {
  start: number;
  end: number;
}

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
