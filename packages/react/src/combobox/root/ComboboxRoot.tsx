'use client';
import * as React from 'react';
import type { Group } from '../../internals/resolveValueLabel';
import { AriaCombobox, type AriaComboboxState } from './AriaCombobox';

let warnedUndefinedItems: Set<any>;
if (process.env.NODE_ENV !== 'production') {
  warnedUndefinedItems = new Set();
}

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<
  Value,
  Multiple extends boolean | undefined = false,
  Items extends readonly any[] | undefined = undefined,
  FilteredItems extends readonly any[] | undefined = undefined,
>(
  props: Omit<
    ComboboxRootSourceProps<Value, ComboboxSourceItemFromArrays<Items, FilteredItems>>,
    'items' | 'filteredItems' | 'itemToValue'
  > &
    ComboboxRootMappedValueProps<Value, Multiple> & {
      /**
       * The items to be displayed in the list.
       * Can be either a flat array of items or an array of groups with items.
       */
      items?: Items | undefined;
      /**
       * Filtered items to display in the list.
       * When provided, the list will use these items instead of filtering the `items` prop internally.
       * Use when you want to control filtering logic externally with the `useFilter()` hook.
       */
      filteredItems?: FilteredItems | undefined;
      /**
       * Maps each source item to the value used for selection, change callbacks, and equality checks.
       * Filtering and function children receive the source item. An explicit `<Combobox.Item value>`
       * takes precedence over the mapped value.
       * The returned value should be defined and uniquely identify the item. `undefined` is
       * normalized to `null` and logs a development warning.
       */
      itemToValue: (item: ComboboxSourceItemFromArrays<Items, FilteredItems>) => Value | undefined;
    },
): React.JSX.Element;
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRootLegacyProps<Value, Multiple>,
): React.JSX.Element;
export function ComboboxRoot(
  props: ComboboxRootLegacyProps<any, any> | ComboboxRoot.MappedProps<any, any, any>,
): React.JSX.Element {
  const {
    multiple = false,
    defaultValue,
    value,
    onValueChange,
    autoComplete,
    itemToValue,
    ...other
  } = props;

  const mapItemToValue = React.useMemo(() => {
    if (!itemToValue) {
      return undefined;
    }

    const valueMap = new Map<any, any>();
    const negativeZeroKey = {};
    return (item: any) => {
      const key = Object.is(item, -0) ? negativeZeroKey : item;
      if (valueMap.has(key)) {
        return valueMap.get(key);
      }

      let itemValue: any = itemToValue(item);
      if (itemValue === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          if (!warnedUndefinedItems.has(key)) {
            warnedUndefinedItems.add(key);
            console.warn(
              'Base UI: Combobox.Root `itemToValue` returned `undefined`. ' +
                'This cannot identify an item, so the value was replaced with `null`. ' +
                'Return a defined value instead.',
            );
          }
        }
        itemValue = null;
      }
      valueMap.set(key, itemValue);
      return itemValue;
    };
    // Reset the cache when either source snapshot changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemToValue, props.items, props.filteredItems]);

  return (
    <AriaCombobox
      {...(other as any)}
      selectionMode={multiple ? 'multiple' : 'single'}
      selectedValue={value}
      defaultSelectedValue={defaultValue}
      onSelectedValueChange={onValueChange}
      formAutoComplete={autoComplete}
      itemToValue={mapItemToValue}
    />
  );
}

type ModeFromMultiple<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';

type ComboboxValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

type ComboboxRootSourceProps<Value, Item> = {
  /**
   * The items to be displayed in the list.
   * Can be either a flat array of items or an array of groups with items.
   */
  items?: readonly any[] | undefined;
  /**
   * Filtered items to display in the list.
   * When provided, the list will use these items instead of filtering the `items` prop internally.
   * Use when you want to control filtering logic externally with the `useFilter()` hook.
   */
  filteredItems?: readonly any[] | undefined;
  /**
   * Filter function used to match items vs input query.
   */
  filter?:
    | null
    | ((item: Item, query: string, itemToString?: (item: Item) => string) => boolean)
    | undefined;
  /**
   * Maps each source item to the value used for selection, change callbacks, and equality checks.
   * Filtering and function children receive the source item. An explicit `<Combobox.Item value>`
   * takes precedence over the mapped value.
   * The returned value should be defined and uniquely identify the item. `undefined` is
   * normalized to `null` and logs a development warning.
   */
  itemToValue?: ((item: Item) => Exclude<Value, undefined>) | undefined;
};

type ComboboxSourceItem<Item> = [Item] extends [never]
  ? unknown
  : Item extends Group<infer GroupItem>
    ? GroupItem
    : Item;

type ComboboxRootValueProps<Value, Multiple extends boolean | undefined> = Omit<
  AriaCombobox.Props<Value, ModeFromMultiple<Multiple>>,
  | 'fillInputOnItemPress'
  | 'autoComplete'
  | 'formAutoComplete'
  | 'submitOnItemClick'
  | 'autoHighlight'
  | 'keepHighlight'
  | 'highlightItemOnHover'
  | 'itemToStringLabel'
  | 'itemToStringValue'
  | 'itemToValue'
  | 'isItemEqualToValue'
  | 'items'
  | 'filteredItems'
  | 'filter'
  // Different names
  | 'selectionMode'
  | 'defaultSelectedValue'
  | 'selectedValue'
  | 'onSelectedValueChange'
  // Custom JSDoc
  | 'actionsRef'
  | 'onOpenChange'
  | 'onInputValueChange'
  | 'onItemHighlighted'
> & {
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple | undefined;
  /**
   * Provides a hint to the browser for autofill.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
   */
  autoComplete?: string | undefined;
  /**
   * Whether the first matching item is highlighted automatically while filtering.
   * @default false
   */
  autoHighlight?: boolean | undefined;
  /**
   * Whether moving the pointer over items should highlight them.
   * Disabling this prop allows CSS `:hover` to be differentiated from the `:focus` (`data-highlighted`) state.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * Converts an item value to a string representation for display in the input.
   * When `itemToValue` is specified, this receives the mapped value.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   */
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  /**
   * Converts an item value to a string representation for form submission.
   * When `itemToValue` is specified, this receives the mapped value.
   * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: ((itemValue: Value) => string) | undefined;
  /**
   * Custom comparison logic used to determine if a combobox item value matches the current selected value. Useful when item values are objects without matching referentially.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
  /**
   * The uncontrolled selected value of the combobox when it's initially rendered.
   *
   * To render a controlled combobox, use the `value` prop instead.
   */
  defaultValue?: ComboboxValueType<Value, Multiple> | null | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Manually unmounts the combobox.
   * Call this after any externally controlled closing animation finishes.
   */
  actionsRef?: React.RefObject<ComboboxRoot.Actions | null> | undefined;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Event handler called when the input value changes.
   */
  onInputValueChange?:
    | ((inputValue: string, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation.
   * - `'pointer'`: the highlight changed due to pointer hovering.
   * - `'none'`: the highlight changed programmatically.
   */
  onItemHighlighted?:
    | ((
        highlightedValue: Value | undefined,
        eventDetails: ComboboxRoot.HighlightEventDetails,
      ) => void)
    | undefined;
  /**
   * The selected value of the combobox. Use when controlled.
   */
  value?: ComboboxValueType<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?:
    | ((
        value: ComboboxValueType<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: ComboboxRoot.ChangeEventDetails,
      ) => void)
    | undefined;
};

export type ComboboxRootMappedProps<
  Value,
  Multiple extends boolean | undefined = false,
  Item = Value,
> = Omit<ComboboxRootSourceProps<Value, Item>, 'items' | 'filteredItems' | 'itemToValue'> &
  ComboboxRootMappedValueProps<Value, Multiple> & {
    items?: readonly (Item | Group<Item>)[] | undefined;
    filteredItems?: readonly (Item | Group<Item>)[] | undefined;
    itemToValue: (item: Item) => Value | undefined;
  };

type ComboboxRootMappedValueProps<Value, Multiple extends boolean | undefined> = Omit<
  ComboboxRootValueProps<Value, Multiple>,
  'onValueChange' | 'onItemHighlighted'
> & {
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?:
    | ((
        value: ComboboxValueType<NoInfer<Value>, Multiple> | (Multiple extends true ? never : null),
        eventDetails: ComboboxRoot.ChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   */
  onItemHighlighted?:
    | ((
        highlightedValue: NoInfer<Value> | undefined,
        eventDetails: ComboboxRoot.HighlightEventDetails,
      ) => void)
    | undefined;
};

export type ComboboxRootProps<Value, Multiple extends boolean | undefined = false> = Omit<
  ComboboxRootSourceProps<Value, Value>,
  'itemToValue'
> &
  ComboboxRootValueProps<Value, Multiple>;

type ComboboxRootLegacyProps<Value, Multiple extends boolean | undefined> = ComboboxRootProps<
  Value,
  Multiple
> & {
  itemToValue?: undefined;
};

type ComboboxSourceItemFromArray<Items> = Items extends readonly (infer Item)[]
  ? ComboboxSourceItem<Item>
  : never;

type ComboboxSourceItemFromArrays<Items, FilteredItems> = [
  ComboboxSourceItemFromArray<Exclude<Items | FilteredItems, undefined>>,
] extends [never]
  ? unknown
  : ComboboxSourceItemFromArray<Exclude<Items | FilteredItems, undefined>>;

export interface ComboboxRootState extends AriaComboboxState {}

export type ComboboxRootActions = AriaCombobox.Actions;

export type ComboboxRootChangeEventReason = AriaCombobox.ChangeEventReason;
export type ComboboxRootChangeEventDetails = AriaCombobox.ChangeEventDetails;

export type ComboboxRootHighlightEventReason = AriaCombobox.HighlightEventReason;
export type ComboboxRootHighlightEventDetails = AriaCombobox.HighlightEventDetails;

export namespace ComboboxRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = ComboboxRootProps<
    Value,
    Multiple
  >;
  export type MappedProps<
    Value,
    Multiple extends boolean | undefined = false,
    Item = Value,
  > = ComboboxRootMappedProps<Value, Multiple, Item>;
  export type State = ComboboxRootState;
  export type Actions = ComboboxRootActions;
  export type ChangeEventReason = ComboboxRootChangeEventReason;
  export type ChangeEventDetails = ComboboxRootChangeEventDetails;
  export type HighlightEventReason = ComboboxRootHighlightEventReason;
  export type HighlightEventDetails = ComboboxRootHighlightEventDetails;
}
