import type { SelectFilterFunction } from './SelectFilterRoot';
import type { SelectFilterProvider } from '../filter-provider/SelectFilterProvider';

/** The filtering props of `Select.FilterProvider`, applied to the root directly inside it. */
export interface SelectFilterRootFilterProps {
  /**
   * Replaces the default case-insensitive substring matching while the filter root controls which
   * registered items remain visible.
   * Receives an item's label or rendered text together with the trimmed query, and keeps the item
   * when it returns `true`.
   * Pass `null` when filtering the items yourself and deciding which items to render.
   */
  filter?: SelectFilterFunction | null | undefined;
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
   * The uncontrolled filter query when the select is initially rendered.
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
    | ((value: string, eventDetails: SelectFilterProvider.InputValueChangeEventDetails) => void)
    | undefined;
}
