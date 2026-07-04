import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum CollapsibleRootDataAttributes {
  /**
   * Present when the collapsible is open.
   */
  open = 'data-open',
  /**
   * Present when the collapsible is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the collapsible begins animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the collapsible is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
