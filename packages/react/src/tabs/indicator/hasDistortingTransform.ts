import { getComputedStyle } from '@floating-ui/utils/dom';

const EPSILON = 1e-6;

/**
 * Walks from `element` up to the document root and reports whether any ancestor
 * applies a transform that distorts `getBoundingClientRect()` non-uniformly: perspective,
 * a 3D transform, a rotation or skew (non-zero off-diagonal matrix terms), or a flip.
 *
 * Pure translations and positive axis-aligned scales return `false` — those are handled
 * accurately by the rect-based fast path.
 */
export function hasDistortingTransform(element: Element): boolean {
  let node: Element | null = element;

  while (node != null) {
    const css = getComputedStyle(node);
    const { transform } = css;

    // `transform` is empty in environments without layout (e.g. jsdom); skip those so
    // `DOMMatrix` is only constructed from a real `matrix()` / `matrix3d()` value.
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      if (
        !matrix.is2D ||
        Math.abs(matrix.b) > EPSILON ||
        Math.abs(matrix.c) > EPSILON ||
        matrix.a < -EPSILON ||
        matrix.d < -EPSILON
      ) {
        return true;
      }
    }

    if (hasDistortingTransformLonghand(css)) {
      return true;
    }

    node = node.parentElement;
  }

  return false;
}

/**
 * Checks transform longhands that aren't reflected in the computed `transform` matrix.
 */
function hasDistortingTransformLonghand(css: CSSStyleDeclaration): boolean {
  const rotate = css.getPropertyValue('rotate').trim();

  return (
    (rotate !== '' &&
      rotate !== 'none' &&
      (parseFloat(rotate) !== 0 || rotate.includes(' '))) ||
    parseFloat(css.getPropertyValue('perspective')) > 0
  );
}
