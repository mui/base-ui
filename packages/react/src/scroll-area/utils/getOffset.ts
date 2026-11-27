import { getComputedStyle } from '@floating-ui/utils/dom';

export function getOffset(
  element: Element | null,
  prop: 'margin' | 'padding',
  axis: 'x' | 'y',
): number {
  if (!element) {
    return 0;
  }

  const styles = getComputedStyle(element);
  const key = `${prop}${axis === 'x' ? 'Inline' : 'Block'}` as const;
  const start = parseFloat(styles[`${key}Start`]);

  // Safari misreports `marginInlineEnd` in RTL.
  // We have to assume the start/end values are symmetrical, which is likely.
  if (axis === 'x' && prop === 'margin') {
    return start * 2;
  }

  return start + parseFloat(styles[`${key}End`]);
}

export function getMaxScroll(viewportEl: HTMLElement, vertical: boolean): number {
  return vertical
    ? viewportEl.scrollHeight - viewportEl.clientHeight
    : viewportEl.scrollWidth - viewportEl.clientWidth;
}

export function getTrackMetrics(
  viewportEl: HTMLElement,
  scrollbarEl: HTMLElement,
  thumbEl: HTMLElement,
  vertical: boolean,
) {
  const axis = vertical ? 'y' : 'x';
  const scrollbarOffset = getOffset(scrollbarEl, 'padding', axis);
  const thumbOffset = getOffset(thumbEl, 'margin', axis);
  const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
  const trackSize = vertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;

  return {
    scrollbarOffset,
    thumbOffset,
    thumbSizePx,
    maxThumbOffset: trackSize - thumbSizePx - scrollbarOffset - thumbOffset,
    maxScrollDistance: getMaxScroll(viewportEl, vertical),
  };
}
