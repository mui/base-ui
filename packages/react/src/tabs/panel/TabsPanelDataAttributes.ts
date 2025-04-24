export enum TabsPanelDataAttributes {
  /**
   * Indicates the index of the tab panel.
   */
  index = 'data-index',
  /**
   * Indicates the direction of the activation (based on the previous selected tab).
   * @type {'left' | 'right' | 'up' | 'down' | 'none'}
   */
  activationDirection = 'data-activation-direction',
  /**
   * Indicates the orientation of the tabs.
   * @type {'horizontal' | 'vertical'}
   */
  orientation = 'data-orientation',
  /**
   * Present when the panel is hidden.
   */
  hidden = 'data-hidden',
}
