import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the collapsible panel is open.
 */
export const open = 'data-open';
/**
 * Present when the collapsible panel is closed.
 */
export const closed = 'data-closed';
/**
 * Present when the panel begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the panel is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
