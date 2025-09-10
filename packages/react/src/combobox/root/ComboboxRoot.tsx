'use client';
import * as React from 'react';
import { ComboboxRootInternal } from './ComboboxRootInternal';
import type { Group } from './utils';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/autocomplete)
 */
export function ComboboxRoot<
  ItemValue,
  SelectedValue = ItemValue,
  Multiple extends boolean | undefined = false,
>(props: ComboboxRoot.Props<ItemValue, SelectedValue, Multiple>): React.JSX.Element {
  const { multiple = false as Multiple, defaultValue, value, onValueChange, ...rest } = props;

  return (
    <ComboboxRootInternal
      {...(rest as any)}
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
    | 'clearInputOnCloseComplete'
    | 'fillInputOnItemPress'
    | 'autoComplete'
    // Prevent `items` from driving generic inference at the callsite
    | 'items'
    | 'itemToStringLabel'
    | 'itemToStringValue'
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
     */
    items?: ItemValue[] | Group<ItemValue>[];
    /**
     * When items' values are objects, converts its value to a string label for input display.
     */
    itemToStringLabel?: (itemValue: ItemValue) => string;
    /**
     * When items' values are objects, converts its value to a string value for form submission.
     */
    itemToStringValue?: (itemValue: ItemValue) => string;
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
