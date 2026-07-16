import { ownerWindow } from '@base-ui/utils/owner';

/**
 * Extracts the 2D translation and scale from the element's computed `transform` matrix.
 * Note that the `translate`, `rotate`, and `scale` longhands are separate properties and
 * are not reflected in the computed `transform` value.
 */
export function getElementTransform(element: HTMLElement) {
  const computedStyle = ownerWindow(element).getComputedStyle(element);
  const transform = computedStyle.transform;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;

  if (transform && transform !== 'none') {
    const matrix = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (matrix) {
      const values = matrix[1].split(', ').map(parseFloat);
      if (values.length === 6) {
        translateX = values[4];
        translateY = values[5];
        scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
      } else if (values.length === 16) {
        translateX = values[12];
        translateY = values[13];
        scale = values[0];
      }
    }
  }

  return { x: translateX, y: translateY, scale };
}
