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

  if (isOverflowingX && orientation !== 'vertical') {
    const side = direction === 'ltr' ? 'left' : 'right';
    const offsetX = elementRect[side] - scrollContainerRect[side];

    if (
      direction === 'ltr' &&
      // overflow to the right
      (element.offsetLeft + element.offsetWidth > scrollContainer.clientWidth ||
        // overflow to the left
        elementRect.left < scrollContainerRect.left)
    ) {
      targetX += offsetX + element.offsetWidth - scrollContainer.clientWidth;
    }

    if (direction === 'rtl') {
      if (element.offsetLeft < scrollContainer.scrollLeft) {
        // overflow to the left
        targetX += offsetX - element.offsetWidth + scrollContainer.clientWidth;
      } else if (elementRect.right > scrollContainerRect.right) {
        // overflow to the right
        targetX += elementRect.right - scrollContainerRect.right;
      }
    }
  }

  if (isOverflowingY && orientation !== 'horizontal') {
    if (element.offsetTop < scrollContainer.scrollTop) {
      // overflow upwards
      targetY = element.offsetTop;
    } else if (
      element.offsetTop + element.offsetHeight >
      scrollContainer.scrollTop + scrollContainer.clientHeight
    ) {
      // overflow downwards
      targetY = element.offsetTop + element.offsetHeight - scrollContainer.clientHeight;
    }
  }

  scrollContainer.scrollTo({
    left: targetX,
    top: targetY,
    behavior: 'auto',
  });
}
