import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export const SelectItemIndicatorDataAttributes = {
  /**
   * Present when the indicator is animating in.
   */
  startingStyle: TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the indicator is animating out.
   */
  endingStyle: TransitionStatusDataAttributes.endingStyle,
} as const;
