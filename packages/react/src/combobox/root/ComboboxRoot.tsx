'use client';
import * as React from 'react';
import type { Group } from '../../internals/resolveValueLabel';
import { AriaCombobox, type AriaComboboxState } from './AriaCombobox';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<Value, SourceItem = any>(
  props: ComboboxRootMappedOverloadProps<Value, true, SourceItem> & { multiple: true },
): React.JSX.Element;
export function ComboboxRoot<Value, SourceItem = any>(
  props: ComboboxRootMappedOverloadProps<Value, false, SourceItem> & {
    multiple?: false | undefined;
  },
): React.JSX.Element;
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false, SourceItem = any>(
  props: ComboboxRootMappedOverloadProps<Value, Multiple, SourceItem>,
): React.JSX.Element;
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false, Item = any>(
  props: ComboboxRootMappedProps<Value, Multiple, Item>,
): React.JSX.Element;
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRoot.Props<Value, Multiple>,
): React.JSX.Element;
export function ComboboxRoot(
  props: ComboboxRoot.Props<any, any> | ComboboxRootMappedProps<any, any, any>,
): React.JSX.Element {
  const {
    multiple = false,
    defaultValue,
    value,
    onValueChange,
    autoComplete,
    itemToValue,
    ...other
  } = props as ComboboxRootMappedProps<any, any, any>;

  const warnedUndefinedItemValueRef = React.useRef(false);

  // Memoized so the projected values aren't recomputed on every render when the getter is stable.
  const mapItemToValue = React.useMemo(() => {
    if (!itemToValue) {
      return undefined;
    }

    return (item: any) => {
      const itemValue = itemToValue(item);
      if (itemValue === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          if (!warnedUndefinedItemValueRef.current) {
            warnedUndefinedItemValueRef.current = true;
            console.warn(
              'Base UI: Combobox.Root `itemToValue` returned `undefined`. ' +
                'This cannot identify an item, so the value was replaced with `null`. ' +
                'Return a defined value instead.',
            );
          }
        }
        return null;
      }
      return itemValue;
    };
  }, [itemToValue]);

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

type NormalizedMappedValue<Value> =
  | Exclude<Value, undefined>
  | (undefined extends Value ? null : never);

/** Unwraps grouped source items so callbacks receive leaf items. */
type ComboboxSourceItem<Item> = [Item] extends [never]
  ? unknown
  : Item extends Group<infer GroupItem>
    ? GroupItem
    : Item;

export type ComboboxRootProps<Value, Multiple extends boolean | undefined = false> = Omit<
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
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete).
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

/**
 * Props for the `itemToValue` form of the root, where source items and selected values have
 * different shapes. The source item is inferred from the `items`/`filteredItems` arrays and
 * `Value` primarily from the getter's return. Only the two callbacks that receive the value are
 * wrapped in `NoInfer`: they would otherwise narrow `Value` to whatever a handler happens to
 * accept. The remaining value-shaped props still contribute, so an annotated `itemToStringLabel`
 * can pin `Value` on its own.
 */
export type ComboboxRootMappedProps<
  Value,
  Multiple extends boolean | undefined = false,
  Item = any,
> = Omit<
  ComboboxRootProps<NormalizedMappedValue<Value>, Multiple>,
  'items' | 'filteredItems' | 'filter' | 'itemToStringLabel' | 'onValueChange' | 'onItemHighlighted'
> & {
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?:
    | ((
        value:
          | ComboboxValueType<NoInfer<NormalizedMappedValue<Value>>, Multiple>
          | (Multiple extends true ? never : null),
        eventDetails: ComboboxRoot.ChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   */
  onItemHighlighted?:
    | ((
        highlightedValue: NoInfer<NormalizedMappedValue<Value>> | undefined,
        eventDetails: ComboboxRoot.HighlightEventDetails,
      ) => void)
    | undefined;
  /**
   * The items to be displayed in the list.
   * Can be either a flat array of items or an array of groups with items.
   */
  items?: readonly Item[] | readonly Group<Item>[] | undefined;
  /**
   * Filtered items to display in the list.
   * When provided, the list will use these items instead of filtering the `items` prop internally.
   * Use when you want to control filtering logic externally with the `useFilter()` hook.
   */
  filteredItems?: readonly Item[] | readonly Group<Item>[] | undefined;
  /**
   * Filter function used to match items vs input query.
   */
  filter?:
    | null
    | ((item: Item, query: string, itemToString?: (item: Item) => string) => boolean)
    | undefined;
  /**
   * Converts a mapped value to a string representation for display in the input.
   * The corresponding source item is provided as the second argument when it is available.
   * If the source item shape is `{ value, label }`, its label is used automatically without
   * needing to specify this prop.
   */
  itemToStringLabel?:
    | ((itemValue: NormalizedMappedValue<Value>, sourceItem?: Item | undefined) => string)
    | undefined;
  /**
   * Maps each source item to the value used for selection, change callbacks, and equality checks.
   * Filtering and function children receive the source item. Collection items use the mapped
   * value; manually rendered items must specify a value of the same type.
   * The returned value should be defined and uniquely identify the item. `undefined` is
   * normalized to `null`, reflected in callback types, and logs a development warning.
   */
  itemToValue: (item: Item) => Value;
};

type ComboboxRootMappedOverloadProps<
  Value,
  Multiple extends boolean | undefined,
  SourceItem,
> = Omit<
  ComboboxRootMappedProps<Value, Multiple, ComboboxSourceItem<SourceItem>>,
  'items' | 'filteredItems'
> & {
  items?: readonly SourceItem[] | undefined;
  filteredItems?: readonly SourceItem[] | undefined;
};

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
    Item = any,
  > = ComboboxRootMappedProps<Value, Multiple, Item>;
  export type State = ComboboxRootState;
  export type Actions = ComboboxRootActions;
  export type ChangeEventReason = ComboboxRootChangeEventReason;
  export type ChangeEventDetails = ComboboxRootChangeEventDetails;
  export type HighlightEventReason = ComboboxRootHighlightEventReason;
  export type HighlightEventDetails = ComboboxRootHighlightEventDetails;
}
