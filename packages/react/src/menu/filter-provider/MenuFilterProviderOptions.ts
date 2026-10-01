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
   * Replaces the default case-insensitive substring matching. Receives each item's label (or
   * rendered text) and the trimmed query; return `true` to show the item.
   * Pass `null` when rendering filtered items yourself.
   */
  filter?: MenuFilterFunction | null | undefined;
  /**
   * Whether filtering highlights the first matching item automatically.
   * - `true`: highlight it while the query is not empty.
   * - `'always'`: highlight it even when the query is empty.
   *
   * Opening the menu from the keyboard highlights the first item either way, and the arrow keys
   * can move the highlight to another item.
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
