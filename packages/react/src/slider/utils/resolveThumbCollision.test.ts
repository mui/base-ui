import { expect } from 'chai';
import { resolveThumbCollision } from './resolveThumbCollision';

describe('resolveThumbCollision', () => {
  it('prevents thumbs from passing each other when behavior is "none"', () => {
    const result = resolveThumbCollision({
      behavior: 'none',
      values: [20, 40],
      pressedIndex: 0,
      nextValue: 70,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenValues: 0,
    });

    expect(result.value).to.deep.equal([40, 40]);
    expect(result.thumbIndex).to.equal(0);
    expect(result.didSwap).to.equal(false);
  });

  it('pushes thumbs forward without cling when behavior is "push"', () => {
    const result = resolveThumbCollision({
      behavior: 'push',
      values: [20, 40],
      pressedIndex: 0,
      nextValue: 70,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenValues: 0,
    });

    expect(result.value).to.deep.equal([70, 70]);
    expect(result.thumbIndex).to.equal(0);
    expect(result.didSwap).to.equal(false);
  });

  it('swaps thumbs when behavior is "swap"', () => {
    const result = resolveThumbCollision({
      behavior: 'swap',
      values: [20, 40],
      pressedIndex: 0,
      nextValue: 65,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenValues: 0,
    });

    expect(result.value).to.deep.equal([40, 65]);
    expect(result.thumbIndex).to.equal(1);
    expect(result.didSwap).to.equal(true);
  });
});
