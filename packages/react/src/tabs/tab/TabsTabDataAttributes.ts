export enum TabsTabDataAttributes {
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
   * Present when the tab is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the tab is highlighted.
   */
  highlighted = 'data-highlighted',
  /**
   * Present when the tab is selected.
   */
  selected = 'data-selected',
}
