import { getComputedStyle } from '@floating-ui/utils/dom';

const EPSILON = 1e-6;

/**
 * Walks from `element` up to the document root and reports whether any ancestor
 * applies a transform that distorts `getBoundingClientRect()` non-uniformly: perspective,
 * a 3D transform, or a rotation or skew (non-zero off-diagonal matrix terms).
 *
 * Pure translations and axis-aligned scales return `false` — those are handled
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
      if (!matrix.is2D || Math.abs(matrix.b) > EPSILON || Math.abs(matrix.c) > EPSILON) {
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
 * `rotate` can be an axis-angle value (`x y z angle`), so the last angle token is used.
 */
function hasDistortingTransformLonghand(css: CSSStyleDeclaration): boolean {
  const rotate = css.getPropertyValue('rotate').trim();
  const angles = rotate.match(/-?(?:\d+|\d*\.\d+)(?:e[-+]?\d+)?(?:deg|rad|grad|turn)/gi);
  const angle = angles && angles[angles.length - 1];

  return (
    (rotate !== '' &&
      rotate !== 'none' &&
      (angle == null || Math.abs(parseFloat(angle)) > EPSILON)) ||
    parseFloat(css.getPropertyValue('perspective')) > 0
  );
}
