import { hasComputedStyleMapSupport } from './hasComputedStyleMapSupport';
import { ownerWindow } from './owner';

export type TextDirection = 'ltr' | 'rtl';

export function getTextDirection(element: HTMLElement): TextDirection {
  if (hasComputedStyleMapSupport()) {
    const direction = element.computedStyleMap().get('direction');

    return (direction as CSSKeywordValue)?.value as TextDirection;
  }

  return ownerWindow(element).getComputedStyle(element).direction as TextDirection;
}
