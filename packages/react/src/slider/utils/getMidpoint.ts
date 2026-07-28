export function getMidpoint(element: HTMLElement, vertical: boolean): number {
  const rect = element.getBoundingClientRect();
  return vertical ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2;
}
