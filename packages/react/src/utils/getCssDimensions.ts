import { type Dimensions, round } from '@floating-ui/utils';
import { getComputedStyle } from '@floating-ui/utils/dom';

export function getCssDimensions(element: HTMLElement): Dimensions {
  const css = getComputedStyle(element);
  // In testing environments, the `width` and `height` properties can be empty
  // strings, returning NaN. Fallback to `0` in this case.
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const { offsetWidth, offsetHeight } = element;

  if (round(width) !== offsetWidth || round(height) !== offsetHeight) {
    width = offsetWidth;
    height = offsetHeight;
  }

  return {
    width,
    height,
  };
}
