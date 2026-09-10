/** The linear part of a CSS transform; translation is deliberately omitted. */
export interface LinearTransform {
  a: number;
  b: number;
  c: number;
  d: number;
}

export const identityLinearTransform: LinearTransform = { a: 1, b: 0, c: 0, d: 1 };

const COMPUTED_MATRIX = /^matrix(3d)?\(([^)]*)\)$/;

/** `left · right`, using CSS's column-vector convention. */
export function multiplyLinearTransforms(
  left: LinearTransform,
  right: LinearTransform,
): LinearTransform {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
  };
}

/** The 2×2 part of a computed matrix, optionally rejecting 3D transforms. */
export function parseComputedLinearTransform(
  transform: string,
  allow3d = true,
): LinearTransform | null {
  const match = COMPUTED_MATRIX.exec(transform);
  if (!match || (match[1] && !allow3d)) {
    return null;
  }
  const values = match[2].split(',').map(Number);
  const [a, b, c, d] = match[1]
    ? [values[0], values[1], values[4], values[5]]
    : [values[0], values[1], values[2], values[3]];
  return [a, b, c, d].every((value) => Number.isFinite(value)) ? { a, b, c, d } : null;
}

/** Parse a computed CSS angle, whose canonical unit is degrees. */
export function parseComputedDegrees(value: string): number | null {
  const match = value.match(/^([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?)deg$/i);
  if (!match) {
    return null;
  }
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

/** The `scale` longhand, excluding its visually irrelevant z component. */
export function parseScaleLinearTransform(scale: string): LinearTransform | null {
  if (!scale || scale === 'none') {
    return null;
  }
  const parts = scale.trim().split(/\s+/);
  const x = Number(parts[0]);
  const y = parts.length > 1 ? Number(parts[1]) : x;
  return Number.isFinite(x) && Number.isFinite(y) ? { a: x, b: 0, c: 0, d: y } : null;
}

/** Parse the `rotate` longhand, optionally requiring an in-plane rotation. */
export function parseRotateLinearTransform(
  rotate: string,
  requirePlane = false,
): LinearTransform | null {
  if (!rotate || rotate === 'none') {
    return null;
  }
  const parts = rotate.trim().split(/\s+/);
  const degrees = parseComputedDegrees(parts.at(-1) ?? '');
  if (degrees === null) {
    return null;
  }
  let [x, y, z] = [0, 0, 1];
  if (parts.length === 2) {
    [x, y, z] = [Number(parts[0] === 'x'), Number(parts[0] === 'y'), Number(parts[0] === 'z')];
  } else if (parts.length === 4) {
    [x, y, z] = [Number(parts[0]), Number(parts[1]), Number(parts[2])];
  } else if (parts.length !== 1) {
    return null;
  }
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length === 0 || (requirePlane && (x !== 0 || y !== 0))) {
    return null;
  }
  const angle = (degrees * Math.PI) / 180;
  const [ux, uy] = [x / length, y / length];
  const cos = Math.cos(angle);
  const sin = (z / length) * Math.sin(angle);
  const spread = uy * ux * (1 - cos);
  return {
    a: cos + ux * ux * (1 - cos),
    b: spread + sin,
    c: spread - sin,
    d: cos + uy * uy * (1 - cos),
  };
}
