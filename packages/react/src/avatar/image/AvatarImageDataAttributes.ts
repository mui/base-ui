import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum AvatarImageDataAttributes {
  /**
   * Present while the image is loading.
   */
  loading = 'data-loading',
  /**
   * Present when the image failed to load.
   */
  error = 'data-error',
  /**
   * Present when the image begins animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the image is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
