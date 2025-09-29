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

  it('restores pushed thumbs towards their initial positions when behavior is "push-sticky"', () => {
    const initialValues = [30, 50];

    const pushed = resolveThumbCollision({
      behavior: 'push-sticky',
      values: initialValues,
      initialValues,
      pressedIndex: 1,
      nextValue: 20,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenValues: 0,
    });

    expect(pushed.value).to.deep.equal([20, 20]);

    const restored = resolveThumbCollision({
      behavior: 'push-sticky',
      values: pushed.value as number[],
      initialValues,
      pressedIndex: 1,
      nextValue: 35,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenValues: 0,
    });

    expect(restored.value).to.deep.equal([30, 35]);
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
