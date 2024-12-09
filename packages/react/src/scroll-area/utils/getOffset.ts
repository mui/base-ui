export function getOffset(
  element: Element | null,
  prop: 'margin' | 'padding',
  axis: 'x' | 'y',
): number {
  if (!element) {
    return 0;
  }

  const styles = getComputedStyle(element);
  const start = axis === 'x' ? 'Left' : 'Top';
  const end = axis === 'x' ? 'Right' : 'Bottom';

  return parseFloat(styles[`${prop}${start}`]) + parseFloat(styles[`${prop}${end}`]);
}
