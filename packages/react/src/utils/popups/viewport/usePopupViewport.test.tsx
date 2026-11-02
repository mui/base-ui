import { expect, describe, it } from 'vitest';
import { calculateRelativePosition, getActivationDirection } from './usePopupViewport';
import type { Offset } from './usePopupViewport';

describe('getActivationDirection', () => {
  it('returns undefined without an offset', () => {
    expect(getActivationDirection(null)).toBe(undefined);
  });

  // The value is a space-separated token list (matched with `~=` selectors), so compare tokens
  // rather than the exact string.
  it.each([
    { offset: { horizontal: 100, vertical: 100 }, expected: ['right', 'down'] },
    { offset: { horizontal: -100, vertical: -100 }, expected: ['left', 'up'] },
    { offset: { horizontal: 100, vertical: -100 }, expected: ['right', 'up'] },
    { offset: { horizontal: -100, vertical: 100 }, expected: ['left', 'down'] },
    // An axis within tolerance contributes no token.
    { offset: { horizontal: 100, vertical: 0 }, expected: ['right'] },
    { offset: { horizontal: -100, vertical: 0 }, expected: ['left'] },
    { offset: { horizontal: 0, vertical: 100 }, expected: ['down'] },
    { offset: { horizontal: 0, vertical: -100 }, expected: ['up'] },
    { offset: { horizontal: 0, vertical: 0 }, expected: [] },
    // The tolerance is 5px and exclusive.
    { offset: { horizontal: 5, vertical: 5 }, expected: [] },
    { offset: { horizontal: -5, vertical: -5 }, expected: [] },
    { offset: { horizontal: 5.5, vertical: -5.5 }, expected: ['right', 'up'] },
    { offset: { horizontal: 6, vertical: 6 }, expected: ['right', 'down'] },
    { offset: { horizontal: -6, vertical: -6 }, expected: ['left', 'up'] },
  ] satisfies Array<{ offset: Offset; expected: string[] }>)(
    'returns [$expected] for $offset.horizontal, $offset.vertical',
    ({ offset, expected }) => {
      expect(getActivationDirection(offset)?.split(' ').filter(Boolean)).toEqual(expected);
    },
  );
});

describe('calculateRelativePosition', () => {
  function createElementWithRect(left: number, top: number, width: number, height: number) {
    const element = document.createElement('div');
    const rect = {
      x: left,
      y: top,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      toJSON: () => ({}),
    };
    element.getBoundingClientRect = () => rect;
    return element;
  }

  it.each([
    {
      name: 'measures from the previous trigger to the new one',
      from: [0, 0, 100, 50],
      to: [200, 100, 100, 50],
      expected: { horizontal: 200, vertical: 100 },
    },
    {
      name: 'is negative when the new trigger is up and to the left',
      from: [200, 100, 100, 50],
      to: [0, 0, 100, 50],
      expected: { horizontal: -200, vertical: -100 },
    },
    {
      // Centers (50, 25) -> (20, 5); the top-left corners would give (10, 0).
      name: 'compares centers, not corners, of differently sized triggers',
      from: [0, 0, 100, 50],
      to: [10, 0, 20, 10],
      expected: { horizontal: -30, vertical: -20 },
    },
    {
      name: 'is zero for triggers that share a center',
      from: [0, 0, 100, 100],
      to: [25, 25, 50, 50],
      expected: { horizontal: 0, vertical: 0 },
    },
  ] satisfies Array<{
    name: string;
    from: [number, number, number, number];
    to: [number, number, number, number];
    expected: Offset;
  }>)('$name', ({ from, to, expected }) => {
    expect(
      calculateRelativePosition(createElementWithRect(...from), createElementWithRect(...to)),
    ).toEqual(expected);
  });
});
