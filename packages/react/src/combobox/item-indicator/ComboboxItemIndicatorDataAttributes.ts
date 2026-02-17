import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';

export enum ComboboxItemIndicatorDataAttributes {
  /**
   * Present when the indicator is animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the indicator is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
