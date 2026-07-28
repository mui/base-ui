import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum ComboboxItemIndicatorDataAttributes {
  /**
   * Present when the indicator begins animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the indicator is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
