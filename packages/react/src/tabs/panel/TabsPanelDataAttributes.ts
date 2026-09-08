import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Indicates the index of the tab panel.
 */
export const index = 'data-index';
/**
 * Indicates the direction of the activation (based on the previous active tab).
 * @type {'left' | 'right' | 'up' | 'down' | 'none'}
 */
export const activationDirection = 'data-activation-direction';
/**
 * Indicates the orientation of the tabs.
 * @type {'horizontal' | 'vertical'}
 */
export const orientation = 'data-orientation';
/**
 * Present when the panel is hidden.
 */
export const hidden = 'data-hidden';
/**
 * Present when the panel begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the panel is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
