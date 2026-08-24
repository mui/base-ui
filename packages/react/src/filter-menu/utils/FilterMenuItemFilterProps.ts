export interface FilterMenuItemFilterProps {
  /**
   * A text representation of the item used for filtering and keyboard text navigation.
   * Falls back to the rendered text.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on, beyond its label.
   * A custom `filter` on the root receives these and decides whether to use them.
   */
  keywords?: readonly string[] | undefined;
}
