import * as React from 'react';
import { ListAction, ListState } from '../../useList';
import { SelectOption } from '../useOption/useOption.types';
import { GenericHTMLProps } from '../../utils/types';
import { CompoundParentContextValue } from '../../useCompound';

export type SelectChangeEventType =
  | React.MouseEvent<Element, MouseEvent>
  | React.KeyboardEvent<Element>
  | React.FocusEvent<Element, Element>
  | null;

export type SelectValue<Value, Multiple> = Multiple extends true ? Value[] : Value | null;

export interface SelectOptionDefinition<Value> {
  value: Value;
  disabled?: boolean;
  label: string;
}

export interface UseSelectParameters<OptionValue, Multiple extends boolean = false> {
  /**
   * A function used to determine if two options' values are equal.
   * By default, reference equality is used.
   *
   * There is a performance impact when using the `areOptionsEqual` prop (proportional to the number of options).
   * Therefore, it's recommented to use the default reference equality comparison whenever possible.
   */
  areOptionsEqual?: (a: OptionValue, b: OptionValue) => boolean;
  /**
   * If `true`, the select will be open by default.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * The default selected value. Use when the component is not controlled.
   */
  defaultValue?: SelectValue<OptionValue, Multiple>;
  /**
   * If `true`, the select is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The ref of the trigger button element.
   */
  buttonRef?: React.Ref<Element>;
  /**
   * The `id` attribute of the listbox element.
   */
  listboxId?: string;
  /**
   * The ref of the listbox element.
   */
  listboxRef?: React.Ref<Element>;
  /**
   * If `true`, the end user can select multiple values.
   * This affects the type of the `value`, `defaultValue`, and `onChange` props.
   *
   * @default false
   */
  multiple?: Multiple;
  /**
   * The `name` attribute of the hidden input element.
   * This is useful when the select is embedded in a form and you want to access the selected value in the form data.
   */
  name?: string;
  /**
   * If `true`, the select embedded in a form must have a selected value.
   * Otherwise, the form submission will fail.
   */
  required?: boolean;
  /**
   * Callback fired when an option is selected.
   */
  onChange?: (
    event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
    value: SelectValue<OptionValue, Multiple>,
  ) => void;
  /**
   * Callback fired when an option is highlighted.
   */
  onHighlightChange?: (
    event:
      | React.MouseEvent<Element, MouseEvent>
      | React.KeyboardEvent<Element>
      | React.FocusEvent<Element, Element>
      | null,
    highlighted: OptionValue | null,
  ) => void;
  /**
   * Callback fired when the listbox is opened or closed.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Controls the open state of the select's listbox.
   * This is the controlled equivalent of the `defaultOpen` prop.
   */
  open?: boolean;
  /**
   * An alternative way to specify the options.
   * If this parameter is set, options defined as JSX children are ignored.
   */
  options?: ReadonlyArray<SelectOptionDefinition<OptionValue>>;
  /**
   * A function to convert the currently selected value to a string.
   * Used to set a value of a hidden input associated with the select,
   * so that the selected value can be posted with a form.
   */
  getSerializedValue?: (
    option: SelectValue<SelectOption<OptionValue>, Multiple>,
  ) => React.InputHTMLAttributes<HTMLInputElement>['value'];
  /**
   * A function used to convert the option label to a string.
   * This is useful when labels are elements and need to be converted to plain text
   * to enable keyboard navigation with character keys.
   *
   * @default defaultOptionStringifier
   */
  getOptionAsString?: (option: SelectOption<OptionValue>) => string;
  /**
   * The selected value.
   * Set to `null` to deselect all options.
   */
  value?: SelectValue<OptionValue, Multiple>;
  /**
   * The name of the component using useSelect.
   * For debugging purposes.
   * @default 'useSelect'
   */
  componentName?: string;
}

export interface UseSelectReturnValue<Value> {
  /**
   * Ref to the button slot DOM node.
   */
  buttonRef: React.RefCallback<Element> | null;
  /**
   * Ref to the listbox slot DOM node.
   */
  listboxRef: React.RefCallback<Element> | null;
  /**
   * Action dispatcher for the select component.
   * Allows to programmatically control the select.
   */
  dispatch: (action: SelectAction<Value>) => void;
  /**
   * Resolver for the button slot's props.
   * @param externalProps event handlers for the button slot
   * @returns props that should be spread on the button slot
   */
  getButtonProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * Resolver for the hidden input slot's props.
   * @param externalProps event handlers for the hidden input slot
   * @returns HTML input attributes that should be spread on the hidden input slot
   */
  getHiddenInputProps: (
    externalProps?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => React.InputHTMLAttributes<HTMLInputElement>;
  /**
   * Resolver for the listbox slot's props.
   * @param externalProps event handlers for the listbox slot
   * @returns props that should be spread on the listbox slot
   */
  getListboxProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  state: SelectInternalState<Value>;
  compoundParentContext: CompoundParentContextValue<any, SelectOption<Value>>;
}

export const SelectActionTypes = {
  buttonClick: 'buttonClick',
  browserAutoFill: 'browserAutoFill',
} as const;

export interface ButtonClickAction {
  type: typeof SelectActionTypes.buttonClick;
  event: React.MouseEvent;
}

export interface BrowserAutofillAction<OptionValue> {
  type: typeof SelectActionTypes.browserAutoFill;
  item: OptionValue;
  event: React.ChangeEvent;
}

export type SelectAction<OptionValue> =
  | ButtonClickAction
  | BrowserAutofillAction<OptionValue>
  | ListAction<OptionValue>;

export interface SelectInternalState<OptionValue> extends ListState<OptionValue> {
  open: boolean;
}
