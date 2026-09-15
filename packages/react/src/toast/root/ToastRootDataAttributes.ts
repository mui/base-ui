import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the toast is expanded in the viewport.
 * @type {boolean}
 */
export const expanded = 'data-expanded';
/**
 * Present when the toast was limited because the toast limit was exceeded.
 * @type {boolean}
 */
export const limited = 'data-limited';
/**
 * The type of the toast.
 * @type {string}
 */
export const type = 'data-type';
/**
 * Present when the toast is being swiped.
 * @type {boolean}
 */
export const swiping = 'data-swiping';
/**
 * The direction the toast was swiped.
 * @type {'up' | 'down' | 'left' | 'right'}
 */
export const swipeDirection = 'data-swipe-direction';
/**
 * Present when the toast begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the toast is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
