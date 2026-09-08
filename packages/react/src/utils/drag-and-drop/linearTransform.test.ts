import { describe, expect, it } from 'vitest';
import { parseComputedDegrees, parseRotateLinearTransform } from './linearTransform';

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
