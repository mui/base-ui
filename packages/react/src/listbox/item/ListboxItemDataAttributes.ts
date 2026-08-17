export enum ListboxItemDataAttributes {
  /**
   * Present when the listbox item is selected.
   */
  selected = 'data-selected',
  /**
   * Present when the listbox item is highlighted.
   */
  highlighted = 'data-highlighted',
  /**
   * Present when the listbox item is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the listbox item is being dragged.
   */
  dragging = 'data-dragging',
  /**
   * Present when the listbox item is a drop target.
   */
  dropTarget = 'data-drop-target',
  /**
   * Indicates the closest edge when the item is a drop target.
   * The value is `'before'` or `'after'`.
   */
  dropTargetEdge = 'data-drop-target-edge',
}
