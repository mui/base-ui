export enum PopoverViewportDataAttributes {
  /**
   * Applied to the direct child of the viewport when no transitions are present.
   * This element is replaced with 'previous' and 'next' containers when transitions occur.
   */
  current = 'data-current',
  /**
   * Applied to the direct child of the viewport that contains the exiting content when transitions are present.
   */
  previous = 'data-previous',
  /**
   * Applied to the direct child of the viewport that contains the entering content when transitions are present.
   */
  next = 'data-next',
  /**
   * Indicates the direction from which the popup was activated.
   * This can be used to create directional animations based on how the popup was triggered.
   * Contains space-separated values for both horizontal and vertical axes.
   * @type {`${'left' | 'right'} {'top' | 'bottom'}`}
   */
  activationDirection = 'data-activation-direction',
}
