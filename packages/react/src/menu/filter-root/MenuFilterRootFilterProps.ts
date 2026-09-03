import type { MenuFilterFunction, MenuFilterRoot } from './MenuFilterRoot';

/** Filtering props shared by `Menu.FilterRoot` and `Menu.FilterSubmenuRoot`. */
export interface MenuFilterRootFilterProps {
  /**
   * Replaces the default case-insensitive substring matching while the filter root controls which
   * registered items remain visible.
   * Receives an item's label or rendered text and each of its keywords individually, together
   * with the trimmed query. The item matches when the function returns `true` for any of them.
   * Pass `null` when filtering mapped items yourself and deciding which items to render.
   */
  filter?: MenuFilterFunction | null | undefined;
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
    | ((value: string, eventDetails: MenuFilterRoot.InputValueChangeEventDetails) => void)
    | undefined;
}
