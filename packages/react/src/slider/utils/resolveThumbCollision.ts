import { clamp } from '../../utils/clamp';
import { replaceArrayItemAtIndex } from './replaceArrayItemAtIndex';
import { getPushedThumbValues } from './getPushedThumbValues';
import { SliderRootContext } from '../root/SliderRootContext';

export interface ResolveThumbCollisionParams {
  behavior: SliderRootContext['thumbCollisionBehavior'];
  values: readonly number[];
  pressedIndex: number;
  nextValue: number;
  min: number;
  max: number;
  step: number;
  minStepsBetweenValues: number;
  initialValues?: readonly number[] | null;
}

export interface ResolveThumbCollisionResult {
  value: number | number[];
  thumbIndex: number;
  didSwap: boolean;
}

export function resolveThumbCollision({
  behavior,
  values,
  pressedIndex,
  nextValue,
  min,
  max,
  step,
  minStepsBetweenValues,
  initialValues,
}: ResolveThumbCollisionParams): ResolveThumbCollisionResult {
  const range = values.length > 1;

  if (!range) {
    return {
      value: nextValue,
      thumbIndex: 0,
      didSwap: false,
    };
  }

  const minValueDifference = step * minStepsBetweenValues;

  switch (behavior) {
    case 'swap': {
      let targetIndex = pressedIndex;

      if (pressedIndex > 0 && nextValue <= values[pressedIndex - 1]) {
        while (targetIndex > 0 && nextValue <= values[targetIndex - 1]) {
          targetIndex -= 1;
        }
      } else if (pressedIndex < values.length - 1 && nextValue >= values[pressedIndex + 1]) {
        while (targetIndex < values.length - 1 && nextValue >= values[targetIndex + 1]) {
          targetIndex += 1;
        }
      }

      const candidateValues = replaceArrayItemAtIndex(values, pressedIndex, nextValue);

      const previousNeighbor = candidateValues[targetIndex - 1];
      const nextNeighbor = candidateValues[targetIndex + 1];

      const lowerBound = previousNeighbor != null ? previousNeighbor + minValueDifference : min;
      const upperBound = nextNeighbor != null ? nextNeighbor - minValueDifference : max;

      const constrainedValue = clamp(nextValue, lowerBound, upperBound);
      candidateValues[targetIndex] = constrainedValue;

      return {
        value: candidateValues,
        thumbIndex: targetIndex,
        didSwap: targetIndex !== pressedIndex,
      };
    }
    case 'push-sticky':
    case 'push': {
      const stickyInitialValues =
        behavior === 'push-sticky' ? (initialValues ?? values) : undefined;
      const nextValues = getPushedThumbValues({
        values,
        index: pressedIndex,
        nextValue,
        min,
        max,
        step,
        minStepsBetweenValues,
        initialValues: stickyInitialValues ?? undefined,
      });

      return {
        value: nextValues,
        thumbIndex: pressedIndex,
        didSwap: false,
      };
    }
    case 'none':
    default: {
      const candidateValues = values.slice();
      const previousNeighbor = candidateValues[pressedIndex - 1];
      const nextNeighbor = candidateValues[pressedIndex + 1];

      const lowerBound = previousNeighbor != null ? previousNeighbor + minValueDifference : min;
      const upperBound = nextNeighbor != null ? nextNeighbor - minValueDifference : max;

      const constrainedValue = clamp(nextValue, lowerBound, upperBound);
      candidateValues[pressedIndex] = constrainedValue;

      return {
        value: candidateValues,
        thumbIndex: pressedIndex,
        didSwap: false,
      };
    }
  }
}
