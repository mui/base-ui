'use client';
import * as React from 'react';
import { AriaCombobox } from './AriaCombobox';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRootControlledProps<Value, Multiple>,
): React.JSX.Element;
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRootUncontrolledProps<Value, Multiple>,
): React.JSX.Element;
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const { multiple = false as Multiple, defaultValue, value, onValueChange, ...other } = props;

  return (
    <AriaCombobox
      {...(other as any)}
      selectionMode={multiple ? 'multiple' : 'single'}
      selectedValue={value}
      defaultSelectedValue={defaultValue}
      onSelectedValueChange={onValueChange}
    />
  );
}

type ModeFromMultiple<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';

type ComboboxValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

type ComboboxRootBaseProps<Value, Multiple extends boolean | undefined> = Omit<
  AriaCombobox.Props<Value, ModeFromMultiple<Multiple>>,
  | 'fillInputOnItemPress'
  | 'autoComplete'
  | 'alwaysSubmitOnEnter'
  | 'autoHighlight'
  | 'keepHighlight'
  | 'highlightItemOnHover'
  | 'itemToStringLabel'
  | 'itemToStringValue'
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
  multiple?: Multiple;
  /**
   * Whether the first matching item is highlighted automatically while filtering.
   * @default false
   */
  autoHighlight?: boolean;
  /**
   * Whether the highlighted item should be preserved when the pointer leaves the list.
   * @default false
   */
  keepHighlight?: boolean;
  /**
   * Whether moving the pointer over items should highlight them.
   * @default true
   */
  highlightItemOnHover?: boolean;
  /**
   * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for display in the input.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   */
  itemToStringLabel?: (itemValue: Value) => string;
  /**
   * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for form submission.
   * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: Value) => string;
  /**
   * Custom comparison logic used to determine if a combobox item value matches the current selected value. Useful when item values are objects without matching referentially.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: (itemValue: Value, selectedValue: Value) => boolean;
  /**
   * The uncontrolled selected value of the combobox when it's initially rendered.
   *
   * To render a controlled combobox, use the `value` prop instead.
   */
  defaultValue?: ComboboxValueType<Value, Multiple> | null;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the combobox will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the combobox manually.
   * Useful when the combobox's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<ComboboxRoot.Actions>;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => void;
  /**
   * Event handler called when the input value changes.
   */
  onInputValueChange?: (inputValue: string, eventDetails: ComboboxRoot.ChangeEventDetails) => void;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation.
   * - `'pointer'`: the highlight changed due to pointer hovering.
   * - `'none'`: the highlight changed programmatically.
   */
  onItemHighlighted?: (
    highlightedValue: Value | undefined,
    eventDetails: ComboboxRoot.HighlightEventDetails,
  ) => void;
};

type ComboboxRootControlledProps<
  Value,
  Multiple extends boolean | undefined,
> = ComboboxRootBaseProps<Value, Multiple> & {
  /**
   * The selected value of the combobox. Use when controlled.
   */
  value: ComboboxValueType<Value, Multiple>;
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?: (
    value: ComboboxValueType<Value, Multiple>,
    eventDetails: ComboboxRoot.ChangeEventDetails,
  ) => void;
};

type ComboboxRootUncontrolledProps<
  Value,
  Multiple extends boolean | undefined,
> = ComboboxRootBaseProps<Value, Multiple> & {
  /**
   * The selected value of the combobox. Use when controlled.
   */
  value?: undefined;
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?: (
    value: ComboboxValueType<Value, Multiple> | (Multiple extends true ? never : null),
    eventDetails: ComboboxRoot.ChangeEventDetails,
  ) => void;
};

type ComboboxRootComponentProps<Value, Multiple extends boolean | undefined> =
  | ComboboxRootControlledProps<Value, Multiple>
  | ComboboxRootUncontrolledProps<Value, Multiple>;

export type ComboboxRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = ComboboxRootComponentProps<Value, Multiple>;

export type ComboboxRootState = AriaCombobox.State;

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
  export type State = ComboboxRootState;
  export type Actions = ComboboxRootActions;
  export type ChangeEventReason = ComboboxRootChangeEventReason;
  export type ChangeEventDetails = ComboboxRootChangeEventDetails;
  export type HighlightEventReason = ComboboxRootHighlightEventReason;
  export type HighlightEventDetails = ComboboxRootHighlightEventDetails;
}
