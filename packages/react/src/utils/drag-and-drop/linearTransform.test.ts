import { describe, expect, it } from 'vitest';
import {
  parseComputedDegrees,
  parseRotateLinearTransform,
  parseComputedLinearTransform,
  parseScaleLinearTransform,
  multiplyLinearTransforms,
} from './linearTransform';

describe('parseComputedDegrees', () => {
  it.each([
    ['1e+06deg', 1_000_000],
    ['1e-06deg', 0.000001],
    ['-2.5E-4deg', -0.00025],
    ['+3deg', 3],
  ])('parses %s', (value, expected) => {
    expect(parseComputedDegrees(value)).toBe(expected);
  });

  it.each(['100grad', '1rad', '0.25turn', 'Infinitydeg', '1e999deg', '1e+deg'])(
    'rejects non-computed or invalid value %s',
    (value) => {
      expect(parseComputedDegrees(value)).toBeNull();
    },
  );
});

describe('parseRotateLinearTransform', () => {
  it('projects a non-z-axis exponent-form rotation', () => {
    const transform = parseRotateLinearTransform('x 6e1deg');

    expect(transform?.a).toBeCloseTo(1);
    expect(transform?.b).toBeCloseTo(0);
    expect(transform?.c).toBeCloseTo(0);
    expect(transform?.d).toBeCloseTo(0.5);
  });
});

describe('linear transforms', () => {
  it('extracts the linear matrix while discarding translation', () => {
    expect(parseComputedLinearTransform('matrix(2, 3, 4, 5, 60, 70)')).toEqual({
      a: 2,
      b: 3,
      c: 4,
      d: 5,
    });
    const matrix3d = 'matrix3d(2, 3, 0, 0, 4, 5, 0, 0, 0, 0, 1, 0, 60, 70, 0, 1)';
    expect(parseComputedLinearTransform(matrix3d)).toEqual({ a: 2, b: 3, c: 4, d: 5 });
    expect(parseComputedLinearTransform(matrix3d, false)).toBeNull();
  });

  it.each(['none', 'matrix(NaN, 0, 0, 1, 0, 0)', 'matrix(1, 2)'])(
    'rejects an unavailable linear matrix: %s',
    (value) => {
      expect(parseComputedLinearTransform(value)).toBeNull();
    },
  );

  it.each([
    ['2', { a: 2, b: 0, c: 0, d: 2 }],
    ['2 3', { a: 2, b: 0, c: 0, d: 3 }],
    ['-2 3 4', { a: -2, b: 0, c: 0, d: 3 }],
    ['none', null],
    ['Infinity', null],
    ['2 invalid', null],
  ])('parses the scale longhand %s', (value, expected) => {
    expect(parseScaleLinearTransform(value)).toEqual(expected);
  });

  it('applies the right transform before the left with non-uniform scale', () => {
    const scale = { a: 2, b: 0, c: 0, d: 3 };
    const rotate = { a: 0, b: 1, c: -1, d: 0 };
    expect(multiplyLinearTransforms(scale, rotate)).toEqual({ a: 0, b: 3, c: -2, d: 0 });
    expect(multiplyLinearTransforms(rotate, scale)).toEqual({ a: 0, b: 2, c: -3, d: 0 });
  });
});
