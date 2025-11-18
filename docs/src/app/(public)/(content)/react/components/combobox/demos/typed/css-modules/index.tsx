import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

export default function App() {
  return <MyCombobox />;
}

export function MyCombobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRootControlledProps<Value, Multiple>,
): React.JSX.Element;
export function MyCombobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxRootUncontrolledProps<Value, Multiple>,
): React.JSX.Element;
export function MyCombobox<Value, Multiple extends boolean | undefined = false>(
  props: Combobox.Root.Props<Value, Multiple>,
): React.JSX.Element {
  return <Combobox.Root<any, any> {...props} />;
}

type ComboboxValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

type ComboboxRootControlledProps<Value, Multiple extends boolean | undefined> = Combobox.Root.Props<
  Value,
  Multiple
> & {
  /**
   * The selected value of the combobox. Use when controlled.
   */
  value: ComboboxValueType<Value, Multiple>;
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?: (
    value: ComboboxValueType<Value, Multiple>,
    eventDetails: Combobox.Root.ChangeEventDetails,
  ) => void;
};

type ComboboxRootUncontrolledProps<
  Value,
  Multiple extends boolean | undefined,
> = Combobox.Root.Props<Value, Multiple> & {
  /**
   * The selected value of the combobox. Use when controlled.
   */
  value?: any;
  /**
   * Event handler called when the selected value of the combobox changes.
   */
  onValueChange?: (
    value: ComboboxValueType<Value, Multiple> | (Multiple extends true ? never : null),
    eventDetails: Combobox.Root.ChangeEventDetails,
  ) => void;
};
