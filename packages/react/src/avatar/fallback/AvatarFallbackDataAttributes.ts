import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';

export enum AvatarFallbackDataAttributes {
  /**
   * Present when the fallback is animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the fallback is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
