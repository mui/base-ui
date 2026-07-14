import { clamp } from '../../internals/clamp';
import { getPushedThumbValues } from './getPushedThumbValues';
import { SliderRootContext } from '../root/SliderRootContext';

export interface ResolveThumbCollisionResult {
  value: number | number[];
  thumbIndex: number;
  didSwap: boolean;
}

/**
 * Positional arguments are deliberate: property names of an options object don't
 * minify, so passing them positionally keeps this internal helper smaller in the bundle.
 */
export function resolveThumbCollision(
  behavior: SliderRootContext['thumbCollisionBehavior'],
  values: readonly number[],
  currentValues: readonly number[] | null | undefined,
  initialValues: readonly number[] | null | undefined,
  pressedIndex: number,
  nextValue: number,
  min: number,
  max: number,
  step: number,
  minStepsBetweenValues: number,
): ResolveThumbCollisionResult {
  const activeValues = currentValues ?? values;
  const baselineValues = initialValues ?? values;
  const range = activeValues.length > 1;

  if (!range) {
    return {
      value: nextValue,
      thumbIndex: 0,
      didSwap: false,
    };
  }

  const minValueDifference = step * minStepsBetweenValues;

  // `push` does its own copy/bounds/rounding pass in `getPushedThumbValues`, so it must not
  // pay for the neighbor-clamp setup below (this is the hottest path — `push` is the default).
  if (behavior === 'push') {
    return {
      value: getPushedThumbValues(
        activeValues,
        pressedIndex,
        nextValue,
        min,
        max,
        step,
        minStepsBetweenValues,
      ),
      thumbIndex: pressedIndex,
      didSwap: false,
    };
  }

  // Shared by `swap` and `none`.
  const candidateValues = activeValues.slice();
  const previousNeighbor = candidateValues[pressedIndex - 1];
  const nextNeighbor = candidateValues[pressedIndex + 1];
  const lowerBound = previousNeighbor != null ? previousNeighbor + minValueDifference : min;
  const upperBound = nextNeighbor != null ? nextNeighbor - minValueDifference : max;
  const pressedValueAfterClamp = Number(clamp(nextValue, lowerBound, upperBound).toFixed(12));
  candidateValues[pressedIndex] = pressedValueAfterClamp;

  switch (behavior) {
    case 'swap': {
      const pressedInitialValue = activeValues[pressedIndex];
      const epsilon = 1e-7;

      const movingForward = nextValue > pressedInitialValue;
      const movingBackward = nextValue < pressedInitialValue;

      const shouldSwapForward =
        movingForward && nextNeighbor != null && nextValue >= nextNeighbor - epsilon;
      const shouldSwapBackward =
        movingBackward && previousNeighbor != null && nextValue <= previousNeighbor + epsilon;

      if (!shouldSwapForward && !shouldSwapBackward) {
        return {
          value: candidateValues,
          thumbIndex: pressedIndex,
          didSwap: false,
        };
      }

      const targetIndex = shouldSwapForward ? pressedIndex + 1 : pressedIndex - 1;

      const initialValuesForPush = candidateValues.map((_, index) => {
        if (index === pressedIndex) {
          return pressedValueAfterClamp;
        }

        const baseline = baselineValues[index];
        if (baseline != null) {
          return baseline;
        }

        return activeValues[index];
      });

      let nextValueForTarget = nextValue;
      if (shouldSwapForward) {
        nextValueForTarget = Math.max(nextValue, candidateValues[targetIndex]);
      } else {
        nextValueForTarget = Math.min(nextValue, candidateValues[targetIndex]);
      }

      const adjustedValues = getPushedThumbValues(
        candidateValues,
        targetIndex,
        nextValueForTarget,
        min,
        max,
        step,
        minStepsBetweenValues,
        initialValuesForPush,
      );

      const neighborIndex = shouldSwapForward ? targetIndex - 1 : targetIndex + 1;

      if (neighborIndex >= 0 && neighborIndex < adjustedValues.length) {
        const previousValue = adjustedValues[neighborIndex - 1];
        const nextValueAfter = adjustedValues[neighborIndex + 1];

        let neighborLowerBound = previousValue != null ? previousValue + minValueDifference : min;
        neighborLowerBound = Math.max(neighborLowerBound, min + neighborIndex * minValueDifference);

        let neighborUpperBound = nextValueAfter != null ? nextValueAfter - minValueDifference : max;
        neighborUpperBound = Math.min(
          neighborUpperBound,
          max - (adjustedValues.length - 1 - neighborIndex) * minValueDifference,
        );

        const restoredValue = clamp(pressedValueAfterClamp, neighborLowerBound, neighborUpperBound);
        adjustedValues[neighborIndex] = Number(restoredValue.toFixed(12));
      }

      return {
        value: adjustedValues,
        thumbIndex: targetIndex,
        didSwap: true,
      };
    }
    case 'none':
    default: {
      return {
        value: candidateValues,
        thumbIndex: pressedIndex,
        didSwap: false,
      };
    }
  }
}
