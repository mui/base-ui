export function getOffset(
  element: Element | null,
  prop: 'margin' | 'padding',
  axis: 'x' | 'y',
): number {
  if (!element) {
    return 0;
  }

  const styles = getComputedStyle(element);
  const name = axis === 'x' ? 'Inline' : 'Block';

  return parseFloat(styles[`${prop}${name}`]);
}
