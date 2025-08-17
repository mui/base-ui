import type { TextDirection } from '../direction-provider/DirectionContext';

export {
  stopEvent,
  isIndexOutOfListBounds,
  isListIndexDisabled,
  createGridCellMap,
  findNonDisabledListIndex,
  getGridCellIndexOfCorner,
  getGridCellIndices,
  getGridNavigatedIndex,
  getMaxListIndex,
  getMinListIndex,
} from '../floating-ui-react/utils';

export interface Dimensions {
  width: number;
  height: number;
}

export const ARROW_UP = 'ArrowUp';
export const ARROW_DOWN = 'ArrowDown';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_RIGHT = 'ArrowRight';
export const HOME = 'Home';
export const END = 'End';

export const HORIZONTAL_KEYS = new Set([ARROW_LEFT, ARROW_RIGHT]);
export const HORIZONTAL_KEYS_WITH_EXTRA_KEYS = new Set([ARROW_LEFT, ARROW_RIGHT, HOME, END]);
export const VERTICAL_KEYS = new Set([ARROW_UP, ARROW_DOWN]);
export const VERTICAL_KEYS_WITH_EXTRA_KEYS = new Set([ARROW_UP, ARROW_DOWN, HOME, END]);
export const ARROW_KEYS = new Set([...HORIZONTAL_KEYS, ...VERTICAL_KEYS]);
export const ALL_KEYS = new Set([...ARROW_KEYS, HOME, END]);
export const COMPOSITE_KEYS = new Set([ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END]);

export const SHIFT = 'Shift' as const;
export const CONTROL = 'Control' as const;
export const ALT = 'Alt' as const;
export const META = 'Meta' as const;
export const MODIFIER_KEYS = new Set([SHIFT, CONTROL, ALT, META] as const);
export type ModifierKey = typeof MODIFIER_KEYS extends Set<infer Keys> ? Keys : never;

export function isNativeInput(
  element: EventTarget,
): element is HTMLElement & (HTMLInputElement | HTMLTextAreaElement) {
  if (element instanceof HTMLInputElement && element.selectionStart != null) {
    return true;
  }
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  return false;
}

export function scrollIntoViewIfNeeded(
  scrollContainer: HTMLElement | null,
  element: HTMLElement | null,
  direction: TextDirection,
  orientation: 'horizontal' | 'vertical' | 'both',
  alignment: 'edge' | 'center' = 'edge',
) {
  if (!scrollContainer || !element || !element.scrollTo) {
    return;
  }

  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;

  const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;

  if (isOverflowingX && orientation !== 'vertical') {
    const elementOffsetLeft = getOffset(scrollContainer, element, 'left');
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);

    const visibleLeft = scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft;
    const visibleRight =
      scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight;
    const elementLeft = elementOffsetLeft - elementStyles.scrollMarginLeft;
    const elementRight = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight;

    if (alignment === 'center') {
      const elementCenter = (elementLeft + elementRight) / 2;
      const visibleWidth =
        scrollContainer.clientWidth -
        (containerStyles.scrollPaddingLeft + containerStyles.scrollPaddingRight);
      const shouldScroll = elementLeft < visibleLeft || elementRight > visibleRight;
      if (shouldScroll) {
        targetX = elementCenter - visibleWidth / 2 - containerStyles.scrollPaddingLeft;
      }
    } else {
      if (direction === 'ltr') {
        if (elementRight > visibleRight) {
          // overflow to the right, scroll to align right edges
          targetX = elementRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
        } else if (elementLeft < visibleLeft) {
          // overflow to the left, scroll to align left edges
          targetX = elementLeft - containerStyles.scrollPaddingLeft;
        }
      }

      if (direction === 'rtl') {
        if (elementLeft < visibleLeft) {
          // overflow to the left, scroll to align left edges
          targetX = elementLeft - containerStyles.scrollPaddingLeft;
        } else if (elementRight > visibleRight) {
          // overflow to the right, scroll to align right edges
          targetX = elementRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
        }
      }
    }
  }

  if (isOverflowingY && orientation !== 'horizontal') {
    const elementOffsetTop = getOffset(scrollContainer, element, 'top');
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);

    const visibleTop = scrollContainer.scrollTop + containerStyles.scrollPaddingTop;
    const visibleBottom =
      scrollContainer.scrollTop +
      scrollContainer.clientHeight -
      containerStyles.scrollPaddingBottom;
    const elementTop = elementOffsetTop - elementStyles.scrollMarginTop;
    const elementBottom =
      elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom;

    if (alignment === 'center') {
      const elementCenter = (elementTop + elementBottom) / 2;
      const visibleHeight =
        scrollContainer.clientHeight -
        (containerStyles.scrollPaddingTop + containerStyles.scrollPaddingBottom);
      const shouldScroll = elementTop < visibleTop || elementBottom > visibleBottom;
      if (shouldScroll) {
        targetY = elementCenter - visibleHeight / 2 - containerStyles.scrollPaddingTop;
      }
    } else {
      if (elementTop < visibleTop) {
        // overflow upwards, align top edges
        targetY = elementTop - containerStyles.scrollPaddingTop;
      } else if (elementBottom > visibleBottom) {
        // overflow downwards, align bottom edges
        targetY =
          elementBottom - scrollContainer.clientHeight + containerStyles.scrollPaddingBottom;
      }
    }
  }

  scrollContainer.scrollTo({
    left: targetX,
    top: targetY,
    behavior: 'auto',
  });
}

function getOffset(ancestor: HTMLElement, element: HTMLElement, side: 'left' | 'top') {
  const propName = side === 'left' ? 'offsetLeft' : 'offsetTop';

  let result = 0;

  while (element.offsetParent) {
    result += element[propName];
    if (element.offsetParent === ancestor) {
      break;
    }
    element = element.offsetParent as HTMLElement;
  }

  return result;
}

function getStyles(element: HTMLElement) {
  const styles = getComputedStyle(element);
  return {
    scrollMarginTop: parseFloat(styles.scrollMarginTop) || 0,
    scrollMarginRight: parseFloat(styles.scrollMarginRight) || 0,
    scrollMarginBottom: parseFloat(styles.scrollMarginBottom) || 0,
    scrollMarginLeft: parseFloat(styles.scrollMarginLeft) || 0,
    scrollPaddingTop: parseFloat(styles.scrollPaddingTop) || 0,
    scrollPaddingRight: parseFloat(styles.scrollPaddingRight) || 0,
    scrollPaddingBottom: parseFloat(styles.scrollPaddingBottom) || 0,
    scrollPaddingLeft: parseFloat(styles.scrollPaddingLeft) || 0,
  };
}
