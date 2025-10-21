import { clamp } from '../../utils/clamp';
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
      const pressedInitialValue = values[pressedIndex];
      const annotatedValues = values.map((value, index) => ({
        value,
        index,
      }));

      annotatedValues[pressedIndex] = {
        value: nextValue,
        index: pressedIndex,
      };

      const sortedAnnotated = annotatedValues.slice().sort((a, b) => {
        if (a.value === b.value) {
          return a.index - b.index;
        }
        return a.value - b.value;
      });

      const targetIndex = sortedAnnotated.findIndex((item) => item.index === pressedIndex);

      if (targetIndex === pressedIndex) {
        const previousNeighbor = values[pressedIndex - 1];
        const nextNeighbor = values[pressedIndex + 1];
        const lowerBound = previousNeighbor != null ? previousNeighbor + minValueDifference : min;
        const upperBound = nextNeighbor != null ? nextNeighbor - minValueDifference : max;
        const constrainedValue = clamp(nextValue, lowerBound, upperBound);
        const updatedValues = values.slice();
        updatedValues[pressedIndex] = constrainedValue;

        return {
          value: updatedValues,
          thumbIndex: pressedIndex,
          didSwap: false,
        };
      }

      const candidateValues = sortedAnnotated.map((item) => item.value);
      const initialValues = sortedAnnotated.map((item) =>
        item.index === pressedIndex ? pressedInitialValue : values[item.index],
      );

      const adjustedValues = getPushedThumbValues({
        values: candidateValues,
        index: targetIndex,
        nextValue: candidateValues[targetIndex],
        min,
        max,
        step,
        minStepsBetweenValues,
        initialValues,
      });

      return {
        value: adjustedValues,
        thumbIndex: targetIndex,
        didSwap: targetIndex !== pressedIndex,
      };
    }
    case 'push': {
      const nextValues = getPushedThumbValues({
        values,
        index: pressedIndex,
        nextValue,
        min,
        max,
        step,
        minStepsBetweenValues,
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
