export enum PopoverViewportDataAttributes {
  /**
   * Applied to the direct child of the viewport when no transitions are present or the new content when it's entering.
   */
  current = 'data-current',
  /**
   * Applied to the direct child of the viewport that contains the exiting content when transitions are present.
   */
  previous = 'data-previous',
  /**
   * Indicates the direction from which the popup was activated.
   * This can be used to create directional animations based on how the popup was triggered.
   * Contains space-separated values for both horizontal and vertical axes.
   * @type {`${'left' | 'right'} {'top' | 'bottom'}`}
   */
  activationDirection = 'data-activation-direction',
  /**
   * Indicates that the viewport is currently transitioning between old and new content.
   */
  transitioning = 'data-transitioning',
}
