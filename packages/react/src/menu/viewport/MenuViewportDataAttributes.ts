/**
 * Applied to the direct child of the viewport when no transitions are present or the new content when it's entering.
 */
export const current = 'data-current';
/**
 * Applied to the direct child of the viewport that contains the exiting content when transitions are present.
 */
export const previous = 'data-previous';
/**
 * Indicates the direction from which the popup was activated.
 * This can be used to create directional animations based on how the popup was triggered.
 * Contains space-separated values for both horizontal and vertical axes.
 * @type {`${'left' | 'right' | ''} ${'down' | 'up' | ''}`}
 */
export const activationDirection = 'data-activation-direction';
/**
 * Indicates that the viewport is currently transitioning between old and new content.
 */
export const transitioning = 'data-transitioning';
/**
 * Present if animations should be instant.
 * @type {'click' | 'dismiss' | 'group' | 'trigger-change'}
 */
export const instant = 'data-instant';
