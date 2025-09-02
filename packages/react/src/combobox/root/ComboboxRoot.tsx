'use client';
import * as React from 'react';
import { ComboboxRootInternal } from './ComboboxRootInternal';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/autocomplete)
 */
export function ComboboxRoot<ItemValue, Multiple extends boolean | undefined = false>(
  props: ComboboxRoot.Props<ItemValue, Multiple>,
): React.JSX.Element {
  const { multiple = false as Multiple, defaultValue, value, onValueChange, ...rest } = props;

  type Mode = ModeFromMultiple<Multiple>;
  const mode = multiple ? 'multiple' : 'single';

  return (
    <ComboboxRootInternal<ItemValue, Mode>
      {...(rest as any)}
      selectionMode={mode}
      selectedValue={value}
      defaultSelectedValue={defaultValue}
      onSelectedValueChange={onValueChange as any}
    />
  );
}

type ModeFromMultiple<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';

export namespace ComboboxRoot {
  type ComboboxItemValueType<
    ItemValue,
    Multiple extends boolean | undefined,
  > = Multiple extends true ? ItemValue[] : ItemValue;

  export type Props<ItemValue, Multiple extends boolean | undefined = false> = Omit<
    ComboboxRootInternal.Props<ItemValue, ModeFromMultiple<Multiple>>,
    | 'clearInputOnCloseComplete'
    | 'modal'
    | 'fillInputOnItemPress'
    | 'autoComplete'
    | 'autoHighlight'
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
     * The uncontrolled selected value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `value` prop instead.
     */
    defaultValue?: ComboboxItemValueType<ItemValue, Multiple> | null;
    /**
     * The selected value of the combobox. Use when controlled.
     */
    value?: ComboboxItemValueType<ItemValue, Multiple>;
    /**
     * Callback fired when the selected value of the combobox changes.
     */
    onValueChange?: (
      value: ComboboxItemValueType<ItemValue, Multiple>,
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
