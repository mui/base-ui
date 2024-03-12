import { expect } from 'chai';
import { toValidatedNumber } from './validate';

const min = Number.MIN_SAFE_INTEGER;
const max = Number.MAX_SAFE_INTEGER;

describe('toValidatedNumber', () => {
  it('returns null when value is null', () => {
    expect(toValidatedNumber(null, 1, min, max, 0)).to.equal(null);
  });

  describe('incrementing', () => {
    it('be 5 when step is 1 and within bounds', () => {
      expect(toValidatedNumber(5, 1, min, max, 0)).to.equal(5);
    });

    it('be 6 when step is 1 and within bounds', () => {
      expect(toValidatedNumber(5.5, 1, min, max, 0)).to.equal(6);
    });

    it('be same value when step is undefined and within bounds', () => {
      expect(toValidatedNumber(5.5, undefined, min, max, 0)).to.equal(5.5);
    });

    it('snaps to 5 when step is 5 and within bounds', () => {
      expect(toValidatedNumber(9, 5, min, max, 0)).to.equal(10);
    });

    it('snaps to 10 when step is 5 and within bounds', () => {
      expect(toValidatedNumber(12, 5, min, max, 0)).to.equal(10);
    });
  });

  describe('decrementing', () => {
    it('be 5 when step is 1 and within bounds', () => {
      expect(toValidatedNumber(5, 1, min, max, 0)).to.equal(5);
    });

    it('be 4 when step is 1 and within bounds', () => {
      expect(toValidatedNumber(5.5, 1, min, max, 0)).to.equal(6);
    });

    it('be same value when step is undefined and within bounds', () => {
      expect(toValidatedNumber(5.5, undefined, min, max, 0)).to.equal(5.5);
    });

    it('snaps to 5 when step is 5 and within bounds', () => {
      expect(toValidatedNumber(9, 5, min, max, 0)).to.equal(10);
    });

    it('snaps to 10 when step is 5 and within bounds', () => {
      expect(toValidatedNumber(12, 5, min, max, 0)).to.equal(10);
    });
  });
});
