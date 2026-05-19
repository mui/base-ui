import { expect } from 'vitest';
import { toValidatedNumber, removeFloatingPointErrors } from './validate';

const min = Number.MIN_SAFE_INTEGER;
const max = Number.MAX_SAFE_INTEGER;

const defaultOptions = {
  step: 1,
  minWithDefault: min,
  maxWithDefault: max,
  minWithZeroDefault: 0,
  format: undefined,
  snapOnStep: true,
  small: false,
  clamp: true,
} as const;

describe('NumberField validate', () => {
  describe('removeFloatingPointErrors', () => {
    it('returns 0.3 for 0.2 + 0.1', () => {
      expect(removeFloatingPointErrors(0.2 + 0.1)).toBe(0.3);
    });

    it('returns 0.3 for 0.2 + 0.1 with maximumFractionDigits', () => {
      expect(removeFloatingPointErrors(0.2 + 0.1, { maximumFractionDigits: 1 })).toBe(0.3);
    });

    it('respects roundingMode when maximumFractionDigits is provided', () => {
      expect(
        removeFloatingPointErrors(1.239, {
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(1.23);
    });

    it('respects half-even rounding at ties', () => {
      expect(
        removeFloatingPointErrors(1.235, {
          maximumFractionDigits: 2,
          roundingMode: 'halfEven',
        }),
      ).toBe(1.24);
      expect(
        removeFloatingPointErrors(1.245, {
          maximumFractionDigits: 2,
          roundingMode: 'halfEven',
        }),
      ).toBe(1.24);
    });

    it('respects rounding mode differences for negative values', () => {
      expect(
        removeFloatingPointErrors(-1.239, {
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(-1.24);
      expect(
        removeFloatingPointErrors(-1.239, {
          maximumFractionDigits: 2,
          roundingMode: 'trunc',
        }),
      ).toBe(-1.23);
    });

    it('rounds percent values at display scale when maximumFractionDigits is provided', () => {
      expect(
        removeFloatingPointErrors(0.01236, {
          style: 'percent',
          maximumFractionDigits: 2,
        }),
      ).toBe(0.0124);
      expect(
        removeFloatingPointErrors(0.01239, {
          style: 'percent',
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(0.0123);
    });

    it.each(['floor', 'ceil', 'trunc', 'expand'] as const)(
      'preserves exact percent precision boundaries with roundingMode: %s',
      (roundingMode) => {
        expect(
          removeFloatingPointErrors(0.0046, {
            style: 'percent',
            maximumFractionDigits: 2,
            roundingMode,
          }),
        ).toBe(0.0046);
      },
    );

    it('rounds percent values at display scale when only minimumFractionDigits is provided', () => {
      expect(
        removeFloatingPointErrors(0.01239, {
          style: 'percent',
          minimumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(0.0123);
    });

    it('rounds values with significant digit precision', () => {
      expect(
        removeFloatingPointErrors(12345, {
          maximumSignificantDigits: 3,
          roundingMode: 'floor',
        }),
      ).toBe(12300);
    });

    it('rounds percent values at display scale when significant digits are provided', () => {
      expect(
        removeFloatingPointErrors(0.01239, {
          style: 'percent',
          maximumSignificantDigits: 3,
          roundingMode: 'floor',
        }),
      ).toBe(0.0123);
    });

    it('uses percent fraction defaults when significant digits use roundingPriority', () => {
      const format = {
        style: 'percent',
        maximumSignificantDigits: 3,
        roundingPriority: 'morePrecision',
      } as const;
      const rounded = removeFloatingPointErrors(0.0123456, format);

      expect(rounded).toBe(0.0123);
      expect(new Intl.NumberFormat('en-US', format).format(rounded)).toBe(
        new Intl.NumberFormat('en-US', format).format(0.0123456),
      );
    });

    it('respects roundingPriority when fraction and significant digits are provided', () => {
      expect(
        removeFloatingPointErrors(1.2345, {
          minimumFractionDigits: 2,
          maximumSignificantDigits: 3,
          roundingMode: 'floor',
          roundingPriority: 'morePrecision',
        }),
      ).toBe(1.234);
    });

    it('does not scale unit percent values when maximumFractionDigits is provided', () => {
      expect(
        removeFloatingPointErrors(1.239, {
          style: 'unit',
          unit: 'percent',
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(1.23);
    });

    it('rounds currency values without percent scaling', () => {
      expect(
        removeFloatingPointErrors(1.239, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(1.23);
    });

    it('respects roundingMode when no precision is provided', () => {
      expect(
        removeFloatingPointErrors(1.2399, {
          minimumIntegerDigits: 1,
          roundingMode: 'floor',
        }),
      ).toBe(1.239);
    });

    it('respects roundingIncrement when maximumFractionDigits is provided', () => {
      expect(
        removeFloatingPointErrors(1.26, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
          roundingIncrement: 5,
        }),
      ).toBe(1.5);
    });

    it('keeps the original finite value when percent scaling overflows before Intl rounding', () => {
      expect(
        removeFloatingPointErrors(Number.MAX_VALUE, {
          style: 'percent',
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        }),
      ).toBe(Number.MAX_VALUE);
    });

    it('returns 1000 for 1000, ignoring grouping', () => {
      expect(removeFloatingPointErrors(1000)).toBe(1000);
    });

    it('ignores formatting style', () => {
      expect(removeFloatingPointErrors(1000, { style: 'currency', currency: 'USD' })).toBe(1000);
    });

    it('uses resolved maximumFractionDigits when only minimum is provided', () => {
      expect(removeFloatingPointErrors(1.234567, { minimumFractionDigits: 5 })).toBe(1.23457);
    });
  });

  describe('toValidatedNumber', () => {
    it('returns null when value is null', () => {
      expect(toValidatedNumber(null, defaultOptions)).toBe(null);
    });

    it('skips clamping when clamp is false', () => {
      expect(
        toValidatedNumber(12, {
          ...defaultOptions,
          minWithDefault: 0,
          maxWithDefault: 10,
          step: undefined,
          snapOnStep: false,
          clamp: false,
        }),
      ).toBe(12);
    });

    describe('incrementing', () => {
      it('snaps 5 to 5 when step is 1', () => {
        expect(toValidatedNumber(5, defaultOptions)).toBe(5);
      });

      it('snaps 5.5 to 5 when step is 1', () => {
        expect(toValidatedNumber(5.5, defaultOptions)).toBe(5);
      });

      it('snaps -0.3 to -1 when step is 1', () => {
        expect(toValidatedNumber(-0.3, defaultOptions)).toBe(-1);
      });

      it('be same value when step is undefined and within bounds', () => {
        expect(
          toValidatedNumber(5.5, {
            ...defaultOptions,
            step: undefined,
          }),
        ).toBe(5.5);
      });

      it('snaps 9 to 5 when step is 5 and within bounds', () => {
        expect(
          toValidatedNumber(9, {
            ...defaultOptions,
            step: 5,
          }),
        ).toBe(5);
      });

      it('snaps 12 to 10 when step is 5 and within bounds', () => {
        expect(
          toValidatedNumber(12, {
            ...defaultOptions,
            step: 5,
          }),
        ).toBe(10);
      });

      it('preserves exact value when snapOnStep is false', () => {
        expect(
          toValidatedNumber(9.7, {
            ...defaultOptions,
            step: 5,
            snapOnStep: false,
          }),
        ).toBe(9.7);
      });
    });

    describe('decrementing', () => {
      it('snaps 5 to 5 when step is -1', () => {
        expect(
          toValidatedNumber(5, {
            ...defaultOptions,
            step: -1,
          }),
        ).toBe(5);
      });

      it('snaps 5.5 to 6 when step is -1', () => {
        expect(
          toValidatedNumber(5.5, {
            ...defaultOptions,
            step: -1,
          }),
        ).toBe(6);
      });

      it('snaps -0.3 to 0 when step is -1', () => {
        expect(
          toValidatedNumber(-0.3, {
            ...defaultOptions,
            step: -1,
          }),
        ).toBe(0);
      });

      it('be same value when step is undefined and within bounds', () => {
        expect(
          toValidatedNumber(5.5, {
            ...defaultOptions,
            step: undefined,
          }),
        ).toBe(5.5);
      });

      it('snaps 9 to 10 when step is -5', () => {
        expect(
          toValidatedNumber(9, {
            ...defaultOptions,
            step: -5,
          }),
        ).toBe(10);
      });

      it('snaps 12 to 15 when step is -5', () => {
        expect(
          toValidatedNumber(12, {
            ...defaultOptions,
            step: -5,
          }),
        ).toBe(15);
      });

      it('preserves exact value when snapOnStep is false', () => {
        expect(
          toValidatedNumber(12.3, {
            ...defaultOptions,
            step: -5,
            snapOnStep: false,
          }),
        ).toBe(12.3);
      });
    });
  });

  it('applies roundingMode after step validation', () => {
    expect(
      toValidatedNumber(1.239, {
        ...defaultOptions,
        step: 0.001,
        snapOnStep: true,
        format: {
          maximumFractionDigits: 2,
          roundingMode: 'floor',
        },
      }),
    ).toBe(1.23);
  });

  it('removes floating point errors by default', () => {
    expect(
      toValidatedNumber(0.2 + 0.1, {
        ...defaultOptions,
        step: undefined,
        snapOnStep: false,
      }),
    ).toBe(0.3);
  });

  describe('fractional step with snapOnStep', () => {
    it('handles increment with step 0.1 without getting stuck', () => {
      // Simulates incrementing 100.1 by 0.1: the raw value becomes 100.19999999999999
      // which should snap to 100.2, not back to 100.1
      expect(
        toValidatedNumber(100.1 + 0.1, {
          ...defaultOptions,
          step: 0.1,
          snapOnStep: true,
        }),
      ).toBe(100.2);
    });

    it('handles decrement with step -0.1 without getting stuck', () => {
      // Simulates decrementing 100.1 by 0.1
      expect(
        toValidatedNumber(100.1 - 0.1, {
          ...defaultOptions,
          step: -0.1,
          snapOnStep: true,
        }),
      ).toBe(100);
    });

    it('handles multiple increments with step 0.01', () => {
      expect(
        toValidatedNumber(0.01 + 0.01, {
          ...defaultOptions,
          step: 0.01,
          snapOnStep: true,
        }),
      ).toBe(0.02);
    });

    it('handles fractional step when a minimum is set', () => {
      expect(
        toValidatedNumber(3 + 0.2 + 0.2, {
          ...defaultOptions,
          step: 0.2,
          minWithDefault: 3,
          minWithZeroDefault: 3,
        }),
      ).toBe(3.4);
    });

    it('rounds to the nearest value when using small step', () => {
      expect(
        toValidatedNumber(0.15, {
          ...defaultOptions,
          step: 0.1,
          snapOnStep: true,
          small: true,
        }),
      ).toBe(0.2);
    });

    it('rounds negative small steps to the nearest value', () => {
      expect(
        toValidatedNumber(-0.15, {
          ...defaultOptions,
          step: -0.1,
          snapOnStep: true,
          small: true,
        }),
      ).toBe(-0.2);
    });
  });
});
