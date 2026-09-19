import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the collapsible is open.
 */
export const open = 'data-open';
/**
 * Present when the collapsible is closed.
 */
export const closed = 'data-closed';
/**
 * Present when the collapsible begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the collapsible is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
