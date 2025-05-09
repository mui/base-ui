import { hasComputedStyleMapSupport } from '../utils/hasComputedStyleMapSupport';
import { ownerWindow } from '../utils/owner';
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

export const HORIZONTAL_KEYS = [ARROW_LEFT, ARROW_RIGHT];
export const HORIZONTAL_KEYS_WITH_EXTRA_KEYS = [ARROW_LEFT, ARROW_RIGHT, HOME, END];
export const VERTICAL_KEYS = [ARROW_UP, ARROW_DOWN];
export const VERTICAL_KEYS_WITH_EXTRA_KEYS = [ARROW_UP, ARROW_DOWN, HOME, END];
export const ARROW_KEYS = [...HORIZONTAL_KEYS, ...VERTICAL_KEYS];
export const ALL_KEYS = [...ARROW_KEYS, HOME, END];
export const COMPOSITE_KEYS = [ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END];

export const SHIFT = 'Shift' as const;
export const CONTROL = 'Control' as const;
export const ALT = 'Alt' as const;
export const META = 'Meta' as const;
export const MODIFIER_KEYS = [SHIFT, CONTROL, ALT, META] as const;
export type ModifierKey = (typeof MODIFIER_KEYS)[number];

export function getTextDirection(element: HTMLElement): TextDirection {
  if (hasComputedStyleMapSupport()) {
    const direction = element.computedStyleMap().get('direction');

    return (direction as CSSKeywordValue)?.value as TextDirection;
  }

  return ownerWindow(element).getComputedStyle(element).direction as TextDirection;
}

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
