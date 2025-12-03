import { expect } from 'chai';
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
} as const;

describe('NumberField validate', () => {
  describe('removeFloatingPointErrors', () => {
    it('returns 0.3 for 0.2 + 0.1', () => {
      expect(removeFloatingPointErrors(0.2 + 0.1)).to.equal(0.3);
    });

    it('returns 0.3 for 0.2 + 0.1 with maximumFractionDigits', () => {
      expect(removeFloatingPointErrors(0.2 + 0.1, { maximumFractionDigits: 1 })).to.equal(0.3);
    });

    it('returns 1000 for 1000, ignoring grouping', () => {
      expect(removeFloatingPointErrors(1000)).to.equal(1000);
    });

    it('ignores formatting style', () => {
      expect(removeFloatingPointErrors(1000, { style: 'currency', currency: 'USD' })).to.equal(
        1000,
      );
    });

    it('uses resolved maximumFractionDigits when only minimum is provided', () => {
      expect(removeFloatingPointErrors(1.234567, { minimumFractionDigits: 5 })).to.equal(1.23457);
    });
  });

  describe('toValidatedNumber', () => {
    it('returns null when value is null', () => {
      expect(toValidatedNumber(null, defaultOptions)).to.equal(null);
    });

    describe('incrementing', () => {
      it('snaps 5 to 5 when step is 1', () => {
        expect(toValidatedNumber(5, defaultOptions)).to.equal(5);
      });

      it('snaps 5.5 to 5 when step is 1', () => {
        expect(toValidatedNumber(5.5, defaultOptions)).to.equal(5);
      });

      it('snaps -0.3 to -1 when step is 1', () => {
        expect(toValidatedNumber(-0.3, defaultOptions)).to.equal(-1);
      });

      it('be same value when step is undefined and within bounds', () => {
        expect(
          toValidatedNumber(5.5, {
            ...defaultOptions,
            step: undefined,
          }),
        ).to.equal(5.5);
      });

      it('snaps 9 to 5 when step is 5 and within bounds', () => {
        expect(
          toValidatedNumber(9, {
            ...defaultOptions,
            step: 5,
          }),
        ).to.equal(5);
      });

      it('snaps 12 to 10 when step is 5 and within bounds', () => {
        expect(
          toValidatedNumber(12, {
            ...defaultOptions,
            step: 5,
          }),
        ).to.equal(10);
      });

      it('preserves exact value when snapOnStep is false', () => {
        expect(
          toValidatedNumber(9.7, {
            ...defaultOptions,
            step: 5,
            snapOnStep: false,
          }),
        ).to.equal(9.7);
      });
    });

    describe('decrementing', () => {
      it('snaps 5 to 5 when step is -1', () => {
        expect(
          toValidatedNumber(5, {
            ...defaultOptions,
            step: -1,
          }),
        ).to.equal(5);
      });

      it('snaps 5.5 to 6 when step is -1', () => {
        expect(
          toValidatedNumber(5.5, {
            ...defaultOptions,
            step: -1,
          }),
        ).to.equal(6);
      });

      it('snaps -0.3 to 0 when step is -1', () => {
        expect(
          toValidatedNumber(-0.3, {
            ...defaultOptions,
            step: -1,
          }),
        ).to.equal(0);
      });

      it('be same value when step is undefined and within bounds', () => {
        expect(
          toValidatedNumber(5.5, {
            ...defaultOptions,
            step: undefined,
          }),
        ).to.equal(5.5);
      });

      it('snaps 9 to 10 when step is -5', () => {
        expect(
          toValidatedNumber(9, {
            ...defaultOptions,
            step: -5,
          }),
        ).to.equal(10);
      });

      it('snaps 12 to 15 when step is -5', () => {
        expect(
          toValidatedNumber(12, {
            ...defaultOptions,
            step: -5,
          }),
        ).to.equal(15);
      });

      it('preserves exact value when snapOnStep is false', () => {
        expect(
          toValidatedNumber(12.3, {
            ...defaultOptions,
            step: -5,
            snapOnStep: false,
          }),
        ).to.equal(12.3);
      });
    });
  });

  it('removes floating point errors by default', () => {
    expect(
      toValidatedNumber(0.2 + 0.1, {
        ...defaultOptions,
        step: undefined,
        snapOnStep: false,
      }),
    ).to.equal(0.3);
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
      ).to.equal(100.2);
    });

    it('handles decrement with step -0.1 without getting stuck', () => {
      // Simulates decrementing 100.1 by 0.1
      expect(
        toValidatedNumber(100.1 - 0.1, {
          ...defaultOptions,
          step: -0.1,
          snapOnStep: true,
        }),
      ).to.equal(100);
    });

    it('handles multiple increments with step 0.01', () => {
      expect(
        toValidatedNumber(0.01 + 0.01, {
          ...defaultOptions,
          step: 0.01,
          snapOnStep: true,
        }),
      ).to.equal(0.02);
    });

    it('handles fractional step when a minimum is set', () => {
      expect(
        toValidatedNumber(3 + 0.2 + 0.2, {
          ...defaultOptions,
          step: 0.2,
          minWithDefault: 3,
          minWithZeroDefault: 3,
        }),
      ).to.equal(3.4);
    });

    it('rounds to the nearest value when using small step', () => {
      expect(
        toValidatedNumber(0.15, {
          ...defaultOptions,
          step: 0.1,
          snapOnStep: true,
          small: true,
        }),
      ).to.equal(0.2);
    });

    it('rounds negative small steps to the nearest value', () => {
      expect(
        toValidatedNumber(-0.15, {
          ...defaultOptions,
          step: -0.1,
          snapOnStep: true,
          small: true,
        }),
      ).to.equal(-0.2);
    });
  });
});
