import type { FilterMenuFilter, FilterMenuRoot } from '../root/FilterMenuRoot';

/** Filtering props shared by `FilterMenu.Root` and `FilterMenu.SubmenuRoot`. */
export interface FilterMenuRootFilterProps {
  /**
   * Replaces the default case-insensitive substring matching for item text.
   * Receives an item's filter text, the trimmed query, and the item's `keywords`, which it must
   * match itself if they should participate.
   * Pass `null` to turn filtering off and decide which items to render yourself.
   */
  filter?: FilterMenuFilter | null | undefined;
  /**
   * Whether the first matching item is highlighted automatically.
   * - `true`: highlight after the user types and keep the highlight while the query changes.
   * - `'always'`: always highlight the first item.
   * @default false
   */
  autoHighlight?: boolean | 'always' | undefined;
  /**
   * Locale used when comparing an item against the query.
   * Defaults to the runtime's default locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The uncontrolled filter query when the menu is initially rendered.
   * To render a controlled query, use the `inputValue` prop instead.
   */
  defaultInputValue?: string | undefined;
  /**
   * The filter query. Use when controlled.
   * When the popup closes, `onInputValueChange` is called with an empty query. The controlled
   * value changes only when the consumer updates this prop.
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the filter query changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: FilterMenuRoot.InputValueChangeEventDetails) => void)
    | undefined;
}
