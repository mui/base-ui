export enum FilterDropdownInputDataAttributes {
  /**
   * Present while the input holds the virtual cursor, so the focus ring stays on it. Keyboard
   * navigation moves the cursor into the list and removes this, while hovering an item leaves it
   * in place, because the pointer does not take the cursor away from the input.
   */
  highlighted = 'data-highlighted',
}
