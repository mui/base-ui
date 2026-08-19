import { expect } from 'vitest';
import { isDeepEqual } from './isDeepEqual';

const testValues: [unknown, unknown, boolean][] = [
  [null, null, true],
  [undefined, undefined, true],
  [null, undefined, false],
  [undefined, null, false],
  ['undefined', undefined, false],
  ['undefined', 'undefined', true],
  [1, 1, true],
  [1, 4, false],
  [3.123, 3.123, true],
  [3.1234567, 3.123, false],
  [false, false, true],
  [true, true, true],
  [true, false, false],
  [false, false, true],
  [[], [], true],
  [[], [1], false],
  [[1], [1], true],
  [[1, 2, 3], [1, 3, 'string'], false],
  [[1, 2, 'string'], [1, 3, 'string'], false],
  [[1, '2', null, { object: 1 }], [1, '2', null, { object: 1 }], true],
  [[1, 2, { object: 1 }], [1, 2, { object: 'string' }], false],
  [{}, {}, true],
  [{}, { test: 1 }, false],
  [{ test: 1 }, {}, false],
  [{ test: 1 }, { test: 1 }, true],
  [{ test: 1 }, { test: 2 }, false],
  [{ test: 1, deep: { test: 2 } }, { test: 1, deep: { test: 2 } }, true],
  [{ test: 1, deep: { test: 'string' } }, { test: 1, deep: { test: 2 } }, false],
];

describe('isDeepEqual', () => {
  testValues.forEach(([a, b, expectedResult]) => {
    it(`should compare ${a} and ${b} to be ${expectedResult}`, () => {
      expect(isDeepEqual(a, b)).toBe(expectedResult);
    });
  });
});
