export enum AccordionPanelDataAttributes {
  /**
   * Indicates the index of the accordion item.
   * @type {number}
   */
  index = 'data-index',
  /**
   * Present when the accordion panel is open.
   */
  open = 'data-open',
  /**
   * Present when the accordion item is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the panel is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the panel is animating out.
   */
  endingStyle = 'data-ending-style',
}
