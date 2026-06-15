import { getComputedStyle, isHTMLElement } from '@floating-ui/utils/dom';

export type ScrollAxis = 'horizontal' | 'vertical';

export function isScrollable(
  element: HTMLElement,
  axis: ScrollAxis,
  // When true, a container that overflows only once extra space is added (e.g. drawer
  // keyboard scroll slack) still counts, as long as it has layout size on the axis.
  allowOverflowIntent = false,
): boolean {
  const style = getComputedStyle(element);

  if (axis === 'vertical') {
    const overflowY = style.overflowY;
    if (overflowY !== 'auto' && overflowY !== 'scroll') {
      return false;
    }
    return allowOverflowIntent
      ? element.clientHeight > 0
      : element.scrollHeight > element.clientHeight;
  }

  const overflowX = style.overflowX;
  if (overflowX !== 'auto' && overflowX !== 'scroll') {
    return false;
  }
  return allowOverflowIntent ? element.clientWidth > 0 : element.scrollWidth > element.clientWidth;
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
  allowOverflowIntent = false,
): HTMLElement | null {
  let node = isHTMLElement(target) ? target : null;
  while (node && node !== root) {
    if (isScrollable(node, axis, allowOverflowIntent)) {
      return node;
    }
    node = node.parentElement;
  }

  return isScrollable(root, axis, allowOverflowIntent) ? root : null;
}
