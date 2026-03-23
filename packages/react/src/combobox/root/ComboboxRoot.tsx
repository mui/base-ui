'use client';
import * as React from 'react';
import { AriaCombobox, type AriaComboboxState } from './AriaCombobox';
import type { Group } from '../../utils/resolveValueLabel';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<
  Value,
  Multiple extends boolean | undefined = false,
  Items extends readonly any[] | readonly Group<any>[] | undefined =
    | readonly Value[]
    | readonly Group<Value>[]
    | undefined,
>(props: ComboboxRoot.Props<Value, Multiple, Items>): React.JSX.Element {
  const {
    multiple = false as Multiple,
    defaultValue,
    value,
    onValueChange,
    autoComplete,
    ...other
  } = props;

  return (
    <AriaCombobox
      {...(other as any)}
      selectionMode={multiple ? 'multiple' : 'single'}
      selectedValue={value}
      defaultSelectedValue={defaultValue}
      onSelectedValueChange={onValueChange}
      formAutoComplete={autoComplete}
    />
  );
}

type ModeFromMultiple<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';

type ComboboxValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

type ItemsInput = readonly any[] | readonly Group<any>[] | undefined;

type ItemFromItems<Items extends readonly any[] | readonly Group<any>[]> =
  Items extends readonly (infer Item)[]
    ? Item extends { items: readonly (infer GroupItem)[] }
      ? GroupItem
      : Item
    : never;

type IsAny<T> = 0 extends 1 & T ? true : false;

type IsUnknown<T> =
  IsAny<T> extends true
    ? false
    : unknown extends T
      ? [T] extends [unknown]
        ? true
        : false
      : false;

type PrimitiveSelectableItemShape<Value> = {
  value: Value;
  label: unknown;
};

type CompatibleItems<Value, Items extends ItemsInput> =
  IsAny<Value> extends true
    ? Items
    : IsUnknown<Value> extends true
      ? Items
      : [NonNullable<Value>] extends [never]
        ? Items
        : [ItemFromItems<NonNullable<Items>>] extends [never]
          ? Items
          : [ItemFromItems<NonNullable<Items>>] extends [NonNullable<Value>]
            ? Items
            : [NonNullable<Value>] extends [ItemFromItems<NonNullable<Items>>]
              ? Items
              : ItemFromItems<NonNullable<Items>> extends PrimitiveSelectableItemShape<
                    infer ItemValue
                  >
                ? [ItemValue] extends [NonNullable<Value>]
                  ? Items
                  : [NonNullable<Value>] extends [ItemValue]
                    ? Items
                    : never
                : never;

type CompatibleItemsConstraint<Value, Items extends ItemsInput> =
  CompatibleItems<Value, Items> extends never
    ? {
        __invalidItemsShapeForValue: never;
      }
    : {};

export type ComboboxRootProps<
  Value,
  Multiple extends boolean | undefined = false,
  Items extends ItemsInput = readonly Value[] | readonly Group<Value>[] | undefined,
> = Omit<
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
  | 'items'
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
   * The items to be displayed in the list.
   * Can be either a flat array of items or an array of groups with items.
   * Primitive `value`/`defaultValue` is only supported implicitly when each item has the shape `{ value, label }`.
   */
  items?: Items | undefined;
  /**
   * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for display in the input.
   * If the shape of the object is `{ value, label }`, the label will be used automatically for display and filtering without needing to specify this prop.
   * In that keyed mode, this prop is bypassed for the `{ value, label }` item array itself and only applies as a fallback when resolving other value shapes.
   */
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  /**
   * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for form submission.
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
   * Must match the item value shape, except when `items` use the `{ value, label }` shape, in which case a primitive `item.value` is also supported.
   *
   * To render a controlled combobox, use the `value` prop instead.
   */
  defaultValue?: ComboboxValueType<Value, Multiple> | null | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the combobox will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the combobox manually.
   * Useful when the combobox's animation is controlled by an external library.
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
   * Must match the item value shape, except when `items` use the `{ value, label }` shape, in which case a primitive `item.value` is also supported.
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
} & CompatibleItemsConstraint<Value, Items>;

export interface ComboboxRootState extends AriaComboboxState {}

export type ComboboxRootActions = AriaCombobox.Actions;

export type ComboboxRootChangeEventReason = AriaCombobox.ChangeEventReason;
export type ComboboxRootChangeEventDetails = AriaCombobox.ChangeEventDetails;

export type ComboboxRootHighlightEventReason = AriaCombobox.HighlightEventReason;
export type ComboboxRootHighlightEventDetails = AriaCombobox.HighlightEventDetails;

export namespace ComboboxRoot {
  export type Props<
    Value,
    Multiple extends boolean | undefined = false,
    Items extends ItemsInput = readonly Value[] | readonly Group<Value>[] | undefined,
  > = ComboboxRootProps<Value, Multiple, Items>;
  export type State = ComboboxRootState;
  export type Actions = ComboboxRootActions;
  export type ChangeEventReason = ComboboxRootChangeEventReason;
  export type ChangeEventDetails = ComboboxRootChangeEventDetails;
  export type HighlightEventReason = ComboboxRootHighlightEventReason;
  export type HighlightEventDetails = ComboboxRootHighlightEventDetails;
}
