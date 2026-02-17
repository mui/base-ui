import { getComputedStyle, isHTMLElement } from '@floating-ui/utils/dom';

export type ScrollAxis = 'horizontal' | 'vertical';

export function isScrollable(element: HTMLElement, axis: ScrollAxis): boolean {
  const style = getComputedStyle(element);

  if (axis === 'vertical') {
    const overflowY = style.overflowY;
    return (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      element.scrollHeight > element.clientHeight
    );
  }

  const overflowX = style.overflowX;
  return (
    (overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth
  );
}

export function hasScrollableAncestor(
  target: HTMLElement,
  root: HTMLElement,
  axes: ScrollAxis[],
): boolean {
  let node: HTMLElement | null = target;
  while (node && node !== root) {
    for (const axis of axes) {
      if (isScrollable(node, axis)) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

export function findScrollableTouchTarget(
  target: EventTarget | null,
  root: HTMLElement,
  axis: ScrollAxis = 'vertical',
): HTMLElement | null {
  let node = isHTMLElement(target) ? target : null;
  while (node && node !== root) {
    if (isScrollable(node, axis)) {
      return node;
    }
    node = node.parentElement;
  }

  return isScrollable(root, axis) ? root : null;
}
