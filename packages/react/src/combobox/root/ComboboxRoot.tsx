'use client';
import * as React from 'react';
import { ComboboxRootInternal } from './ComboboxRootInternal';
import type { Group } from '../../utils/resolveValueLabel';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<SelectedValue, Multiple extends boolean | undefined = false>(
  props: Omit<ComboboxRoot.Props<SelectedValue, SelectedValue, Multiple>, 'items'> & {
    /**
     * The items to be displayed in the list.
     * Can be either a flat array of items or an array of groups with items.
     */ items?: undefined;
  },
): React.JSX.Element;
export function ComboboxRoot<
  ItemValue,
  SelectedValue = ItemValue,
  Multiple extends boolean | undefined = false,
>(props: ComboboxRoot.Props<ItemValue, SelectedValue, Multiple>): React.JSX.Element;
export function ComboboxRoot<
  ItemValue,
  SelectedValue = ItemValue,
  Multiple extends boolean | undefined = false,
>(props: ComboboxRoot.Props<ItemValue, SelectedValue, Multiple>): React.JSX.Element {
  const { multiple = false as Multiple, defaultValue, value, onValueChange, ...other } = props;

  return (
    <ComboboxRootInternal
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

export namespace ComboboxRoot {
  type ComboboxItemValueType<
    TSelected,
    Multiple extends boolean | undefined,
  > = Multiple extends true ? TSelected[] : TSelected;

  export type Props<
    ItemValue,
    SelectedValue = ItemValue,
    Multiple extends boolean | undefined = false,
  > = Omit<
    ComboboxRootInternal.Props<any, ModeFromMultiple<Multiple>>,
    | 'fillInputOnItemPress'
    | 'autoComplete'
    | 'alwaysSubmitOnEnter'
    // Prevent `items` from driving generic inference at the callsite
    | 'items'
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
  > & {
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple?: Multiple;
    /**
     * The items to be displayed in the list.
     * Can be either a flat array of items or an array of groups with items.
     */
    items?: readonly ItemValue[] | readonly Group<ItemValue>[];
    /**
     * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for display in the input.
     * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
     */
    itemToStringLabel?: (itemValue: ItemValue) => string;
    /**
     * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for form submission.
     * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
     */
    itemToStringValue?: (itemValue: ItemValue) => string;
    /**
     * Custom comparison logic used to determine if a combobox item value matches the current selected value. Useful when item values are objects without matching referentially.
     * Defaults to `Object.is` comparison.
     */
    isItemEqualToValue?: (itemValue: ItemValue, selectedValue: ItemValue) => boolean;
    /**
     * The uncontrolled selected value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `value` prop instead.
     */
    defaultValue?: ComboboxItemValueType<SelectedValue, Multiple> | null;
    /**
     * The selected value of the combobox. Use when controlled.
     */
    value?: ComboboxItemValueType<SelectedValue, Multiple>;
    /**
     * Callback fired when the selected value of the combobox changes.
     */
    onValueChange?: (
      value: ComboboxItemValueType<SelectedValue, Multiple>,
      eventDetails: ComboboxRoot.ChangeEventDetails,
    ) => void;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the combobox will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the combobox manually.
     * Useful when the combobox's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<ComboboxRoot.Actions>;
  };

  export type State = ComboboxRootInternal.State;

  export type Actions = ComboboxRootInternal.Actions;

  export type ChangeEventReason = ComboboxRootInternal.ChangeEventReason;
  export type ChangeEventDetails = ComboboxRootInternal.ChangeEventDetails;
}
