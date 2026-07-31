import { expect } from 'vitest';
import { getPushedThumbValues } from './getPushedThumbValues';

describe('getPushedThumbValues', () => {
  it('pushes the next thumb forward when moving past it', () => {
    const result = getPushedThumbValues([20, 40], 0, 70, 0, 100, 1, 0);

    expect(result).toEqual([70, 70]);
  });

  it('ensures minimum distance between thumbs while pushing forward', () => {
    const result = getPushedThumbValues([20, 40], 0, 60, 0, 100, 1, 5);

    expect(result).toEqual([60, 65]);
  });

  it('pushes previous thumbs backward when moving before them', () => {
    const result = getPushedThumbValues([20, 40], 1, -10, 0, 100, 1, 0);

    expect(result).toEqual([0, 0]);
  });

  it('pushes multiple thumbs in sequence', () => {
    const result = getPushedThumbValues([10, 50, 90], 1, 95, 0, 100, 1, 5);

    expect(result).toEqual([10, 95, 100]);
  });

  it('allows fractional minimum distances', () => {
    const result = getPushedThumbValues([0, 1], 0, 1.4, 0, 10, 1, 0.4);

    expect(result[0]).toBe(1.4);
    expect(result[1]).toBe(1.8);
  });

  it('restores pushed thumbs towards their initial value when space allows', () => {
    const initialValues = [30, 50];

    const pushed = getPushedThumbValues(initialValues, 1, 20, 0, 100, 1, 0, initialValues);

    expect(pushed).toEqual([20, 20]);

    const restored = getPushedThumbValues(pushed, 1, 35, 0, 100, 1, 0, initialValues);

    expect(restored).toEqual([30, 35]);
  });
});
