import { getComputedStyle } from '@floating-ui/utils/dom';

const EPSILON = 1e-6;

/**
 * Walks from `element` up to the document root and reports whether any ancestor
 * applies a transform that distorts `getBoundingClientRect()` non-uniformly: a 3D
 * transform, or a rotation or skew (non-zero off-diagonal matrix terms).
 *
 * Pure translations and axis-aligned scales return `false` — those are handled
 * accurately by the rect-based fast path.
 */
export function hasDistortingTransform(element: Element): boolean {
  let node: Element | null = element;

  while (node != null) {
    const { transform } = getComputedStyle(node);

    // `transform` is empty in environments without layout (e.g. jsdom); skip those so
    // `DOMMatrix` is only constructed from a real `matrix()` / `matrix3d()` value.
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      if (!matrix.is2D || Math.abs(matrix.b) > EPSILON || Math.abs(matrix.c) > EPSILON) {
        return true;
      }
    }

    node = node.parentElement;
  }

  return false;
}
