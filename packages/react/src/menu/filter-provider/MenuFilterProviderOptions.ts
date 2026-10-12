import type { MenuFilterProvider } from './MenuFilterProvider';

/** The filtering props of `Menu.FilterProvider`, applied to the root directly inside it. */
export interface MenuFilterProviderOptions {
  /**
   * Filter function used to match items against the query. Receives each item's `label` (or its
   * rendered text) and the trimmed query, and keeps the item when it returns `true`.
   * By default, items match when they contain the query, ignoring case, accents, and punctuation.
   * Pass `null` when rendering filtered items yourself.
   */
  filter?: ((text: string, query: string) => boolean) | null | undefined;
  /**
   * Whether filtering highlights the first matching item automatically.
   * - `true`: highlight it while the query is not empty.
   * - `'always'`: highlight it even when the query is empty.
   *
   * Opening the menu from the keyboard highlights the first item either way, and the arrow keys
   * can move the highlight to another item. With either value, the arrow keys wrap within the
   * list rather than returning to the input, and with `'always'` a pointer highlight stays when
   * the pointer leaves.
   * @default false
   */
  autoHighlight?: boolean | 'always' | undefined;
  /**
   * The locale the default `filter` uses for string comparison.
   * Defaults to the user's runtime locale.
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
    ((value: string, eventDetails: MenuFilterProvider.ChangeEventDetails) => void) | undefined;
}
