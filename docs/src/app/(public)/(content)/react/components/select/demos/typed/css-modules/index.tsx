import * as React from 'react';
import { Select } from '@base-ui-components/react/select';

export default function App() {
  return <MySelect />;
}

export function MySelect<Value, Multiple extends boolean | undefined = false>(
  props: SelectRootControlledProps<Value, Multiple>,
): React.JSX.Element;
export function MySelect<Value, Multiple extends boolean | undefined = false>(
  props: SelectRootUncontrolledProps<Value, Multiple>,
): React.JSX.Element;
export function MySelect<Value, Multiple extends boolean | undefined = false>(
  props: Select.Root.Props<Value, Multiple>,
): React.JSX.Element {
  return <Select.Root<any, any> {...props} />;
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

type SelectRootBaseProps<Value, Multiple extends boolean | undefined> = Omit<
  Select.Root.Props<Value>,
  'multiple' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue?: SelectValueType<Value, Multiple> | null;
};

type SelectRootControlledProps<Value, Multiple extends boolean | undefined> = SelectRootBaseProps<
  Value,
  Multiple
> & {
  /**
   * The value of the select. Use when controlled.
   */
  value: SelectValueType<Value, Multiple>;
  /**
   * Event handler called when the value of the select changes.
   */
  onValueChange?: (
    value: SelectValueType<Value, Multiple>,
    eventDetails: Select.Root.ChangeEventDetails,
  ) => void;
};

type SelectRootUncontrolledProps<Value, Multiple extends boolean | undefined> = SelectRootBaseProps<
  Value,
  Multiple
> & {
  /**
   * The value of the select. Use when controlled.
   */
  value?: any;
  /**
   * Event handler called when the value of the select changes.
   */
  onValueChange?: (
    value: SelectValueType<Value, Multiple> | (Multiple extends true ? never : null),
    eventDetails: Select.Root.ChangeEventDetails,
  ) => void;
};
