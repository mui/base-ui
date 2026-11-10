/**
 * How much a CSS transform scales the element vertically: rects are in viewport
 * pixels, while its own metrics and `scrollTop` are in its pixels.
 */
export function getVerticalScale(
  element: HTMLElement,
  rect: DOMRect = element.getBoundingClientRect(),
): number {
  return element.offsetHeight > 0 ? rect.height / element.offsetHeight : 1;
}
