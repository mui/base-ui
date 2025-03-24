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
});
