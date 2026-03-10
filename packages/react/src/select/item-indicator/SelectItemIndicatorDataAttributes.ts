import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';

export enum SelectItemIndicatorDataAttributes {
  /**
   * Present when the indicator is animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the indicator is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
