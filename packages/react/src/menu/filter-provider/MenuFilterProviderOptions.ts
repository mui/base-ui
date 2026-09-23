import type { MenuFilterProvider } from './MenuFilterProvider';

/**
 * Determines whether an item matches the current filter query.
 *
 * @param text The item's `label`, or its rendered text when the prop is not set.
 * @param query The trimmed filter query.
 */
export type MenuFilterFunction = (text: string, query: string) => boolean;

/** The filtering props of `Menu.FilterProvider`, applied to the root directly inside it. */
export interface MenuFilterProviderOptions {
  /**
   * Replaces the default case-insensitive substring matching while the filter root controls which
   * registered items remain visible.
   * Receives an item's label or rendered text together with the trimmed query, and keeps the item
   * when it returns `true`.
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
   * To render a controlled query, use the `value` prop instead.
   */
  defaultValue?: string | undefined;
  /**
   * The filter query. Use when controlled.
   * When the popup closes, `onValueChange` is called with an empty query. The controlled
   * value changes only when the consumer updates this prop.
   */
  value?: string | undefined;
  /**
   * Event handler called when the filter query changes.
   */
  onValueChange?:
    ((value: string, eventDetails: MenuFilterProvider.ValueChangeEventDetails) => void) | undefined;
}
