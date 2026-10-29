import { getComputedStyle, isHTMLElement } from '@floating-ui/utils/dom';
import type { TextDirection } from '../direction-context/DirectionContext';

export { stopEvent } from '../../utils/popups/event';
export {
  isIndexOutOfListBounds,
  isListIndexDisabled,
  findNonDisabledListIndex,
  getMaxListIndex,
  getMinListIndex,
} from './listIndex';

export const ARROW_UP = 'ArrowUp';
export const ARROW_DOWN = 'ArrowDown';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_RIGHT = 'ArrowRight';
export const HOME = 'Home';
export const END = 'End';
export const PAGE_UP = 'PageUp';
export const PAGE_DOWN = 'PageDown';

export const COMPOSITE_KEYS = new Set([ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END]);

export const SHIFT = 'Shift' as const;
export const MODIFIER_KEYS = [SHIFT, 'Control', 'Alt', 'Meta'] as const;
export type ModifierKey = (typeof MODIFIER_KEYS)[number];

export function isNativeInput(
  element: EventTarget,
): element is HTMLElement & (HTMLInputElement | HTMLTextAreaElement) {
  if (!isHTMLElement(element)) {
    return false;
  }
  return (
    (element.tagName === 'INPUT' && (element as HTMLInputElement).selectionStart != null) ||
    element.tagName === 'TEXTAREA'
  );
}

export function scrollIntoViewIfNeeded(
  scrollContainer: HTMLElement | null,
  element: HTMLElement | null,
  direction: TextDirection,
  orientation: 'horizontal' | 'vertical' | 'both',
) {
  if (!scrollContainer || !element || !element.scrollTo) {
    return;
  }

  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;

  const isOverflowingX =
    orientation !== 'vertical' && scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY =
    orientation !== 'horizontal' && scrollContainer.clientHeight < scrollContainer.scrollHeight;

  if (isOverflowingX || isOverflowingY) {
    const containerStyles = getComputedStyle(scrollContainer);
    const elementStyles = getComputedStyle(element);

    if (isOverflowingX) {
      const elementOffsetLeft = getOffset(scrollContainer, element, 'left');
      const minX =
        elementOffsetLeft -
        parseScrollProp(elementStyles.scrollMarginLeft) -
        parseScrollProp(containerStyles.scrollPaddingLeft);
      const maxX =
        elementOffsetLeft +
        element.offsetWidth +
        parseScrollProp(elementStyles.scrollMarginRight) -
        scrollContainer.clientWidth +
        parseScrollProp(containerStyles.scrollPaddingRight);

      if (direction === 'ltr') {
        if (maxX > targetX) {
          // overflow to the right, scroll to align right edges
          targetX = maxX;
        } else if (minX < targetX) {
          // overflow to the left, scroll to align left edges
          targetX = minX;
        }
      } else if (minX < targetX) {
        // overflow to the left, scroll to align left edges
        targetX = minX;
      } else if (maxX > targetX) {
        // overflow to the right, scroll to align right edges
        targetX = maxX;
      }
    }

    if (isOverflowingY) {
      const elementOffsetTop = getOffset(scrollContainer, element, 'top');
      const minY =
        elementOffsetTop -
        parseScrollProp(elementStyles.scrollMarginTop) -
        parseScrollProp(containerStyles.scrollPaddingTop);
      const maxY =
        elementOffsetTop +
        element.offsetHeight +
        parseScrollProp(elementStyles.scrollMarginBottom) -
        scrollContainer.clientHeight +
        parseScrollProp(containerStyles.scrollPaddingBottom);

      if (minY < targetY) {
        // overflow upwards, align top edges
        targetY = minY;
      } else if (maxY > targetY) {
        // overflow downwards, align bottom edges
        targetY = maxY;
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

function parseScrollProp(value: string) {
  return parseFloat(value) || 0;
}
