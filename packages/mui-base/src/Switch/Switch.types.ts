import * as React from 'react';

// TODO: move to utils
type ComponentRenderFn<Props, State> = (props: Props, state: State) => React.ReactElement;

type BaseUiComponentCommonProps<ElementType extends React.ElementType, OwnerState> = Omit<
  React.ComponentPropsWithoutRef<ElementType>,
  'className'
> & {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className?: string | ((state: OwnerState) => string);
  /**
   * A function to customize rendering of the component.
   */
  render?: ComponentRenderFn<React.ComponentPropsWithRef<ElementType>, OwnerState>;
};

export type SwitchOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
};

export interface SwitchProps
  extends Omit<BaseUiComponentCommonProps<'button', SwitchOwnerState>, 'onChange'> {
  /**
   * If `true`, the component is checked.
   */
  checked?: boolean;
  /**
   * The default checked state. Use when the component is not controlled.
   */
  defaultChecked?: boolean;
  /**
   * If `true`, the component is disabled.
   */
  disabled?: boolean;
  onBlur?: React.FocusEventHandler;
  /**
   * Callback fired when the state is changed.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value` (string).
   * You can pull out the new checked state by accessing `event.target.checked` (boolean).
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler;
  /**
   * If `true`, the component is read only.
   */
  readOnly?: boolean;
  /**
   * If `true`, the `input` element is required.
   */
  required?: boolean;
}

export interface SwitchThumbProps extends BaseUiComponentCommonProps<'span', SwitchOwnerState> {}
