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
} from '@floating-ui/react/utils';

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
) {
  if (!scrollContainer || !element) {
    return;
  }

  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;

  const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;

  const scrollContainerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const side = direction === 'ltr' ? 'left' : 'right';
  const offsetX = elementRect[side] - scrollContainerRect[side];

  if (isOverflowingX && orientation !== 'vertical') {
    if (
      direction === 'ltr' &&
      element.offsetLeft + element.offsetWidth > scrollContainer.clientWidth
    ) {
      targetX = offsetX + element.offsetWidth - scrollContainer.clientWidth;
    }

    if (direction === 'rtl' && element.offsetLeft < scrollContainer.scrollLeft) {
      targetX = offsetX - element.offsetWidth + scrollContainer.clientWidth;
    }
  }

  if (
    isOverflowingY &&
    orientation !== 'horizontal' &&
    element.offsetTop + element.offsetHeight > scrollContainer.clientHeight
  ) {
    const { borderTopWidth } = getScrollContainerStyles(scrollContainer);

    targetY = elementRect.top - scrollContainerRect.top - borderTopWidth;
  }

  scrollContainer.scrollTo({
    left: targetX,
    top: targetY,
    behavior: 'auto',
  });
}

function getScrollContainerStyles(element: HTMLElement) {
  const styles = getComputedStyle(element);

  return {
    borderTopWidth: parseFloat(styles.borderTopWidth),
  };
}
