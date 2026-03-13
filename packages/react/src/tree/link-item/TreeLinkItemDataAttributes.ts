export enum TreeLinkItemDataAttributes {
  /**
   * The id of the item.
   */
  itemId = 'data-item-id',
  /**
   * Present when the item is expanded.
   */
  expanded = 'data-expanded',
  /**
   * Present when the item is collapsed.
   */
  collapsed = 'data-collapsed',
  /**
   * Present when the item is selected.
   */
  selected = 'data-selected',
  /**
   * Present when the item is focused.
   */
  focused = 'data-focused',
  /**
   * Present when the item is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the item has children and can be expanded.
   */
  expandable = 'data-expandable',
  /**
   * Present when the link represents the current page.
   */
  active = 'data-active',
  /**
   * Marks this item as a link item.
   */
  link = 'data-link',
}
