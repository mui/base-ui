import * as TransitionStatusDataAttributes from '../internals/TransitionStatusDataAttributes';

/**
 * Present when the popup is open.
 */
export const open = 'data-open';

/**
 * Present when the popup is closed.
 */
export const closed = 'data-closed';

/**
 * Present when the popup begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;

/**
 * Present when the popup is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;

/**
 * Present when the anchor is hidden.
 */
export const anchorHidden = 'data-anchor-hidden';

/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type { 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
export const side = 'data-side';

/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
export const align = 'data-align';
