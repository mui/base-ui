'use client';
import * as React from 'react';
import { useSwitchRoot } from './useSwitchRoot';
import { SwitchRootContext } from './SwitchRootContext';
import { styleHookMapping } from '../styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Represents the switch itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export const SwitchRoot = React.forwardRef(function SwitchRoot(
  props: SwitchRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    checked: checkedProp,
    className,
    defaultChecked,
    inputRef,
    onCheckedChange,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render,
    ...other
  } = props;

  const { getInputProps, getButtonProps, checked } = useSwitchRoot(props);

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const state: SwitchRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      checked,
      disabled,
      readOnly,
      required,
    }),
    [fieldState, checked, disabled, readOnly, required],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'button',
    className,
    propGetter: getButtonProps,
    state,
    extraProps: other,
    customStyleHookMapping: styleHookMapping,
    ref: forwardedRef,
  });

  return (
    <SwitchRootContext.Provider value={state}>
      {renderElement()}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </SwitchRootContext.Provider>
  );
});

export namespace SwitchRoot {
  export interface Props
    extends useSwitchRoot.Parameters,
      Omit<BaseUIComponentProps<'button', SwitchRoot.State>, 'onChange'> {}

  export interface State extends FieldRoot.State {
    /**
     * Whether the switch is currently active.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to activate or deactivate the switch.
     */
    readOnly: boolean;
    /**
     * Whether the user must activate the switch before submitting a form.
     */
    required: boolean;
  }
}
