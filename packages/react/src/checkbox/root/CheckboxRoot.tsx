'use client';
import * as React from 'react';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';
import type { FieldRoot } from '../../field/root/FieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { useCheckboxRoot } from './useCheckboxRoot';
import { CheckboxRootContext } from './CheckboxRootContext';

/**
 * Represents the checkbox itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxRoot = React.forwardRef(function CheckboxRoot(
  props: CheckboxRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    name,
    onCheckedChange,
    defaultChecked,
    parent = false,
    readOnly = false,
    indeterminate = false,
    required = false,
    disabled: disabledProp = false,
    checked: checkedProp,
    render,
    className,
    inputRef,
    value,
    ...otherProps
  } = props;

  const groupContext = useCheckboxGroupContext();
  const parentContext = groupContext?.parent;
  const isGrouped = parentContext && groupContext.allValues;

  let groupProps: Partial<Omit<CheckboxRoot.Props, 'className'>> = {};
  if (isGrouped) {
    if (parent) {
      groupProps = groupContext.parent.getParentProps();
    } else if (name) {
      groupProps = groupContext.parent.getChildProps(name);
    }
  }

  const {
    checked: groupChecked = checkedProp,
    indeterminate: groupIndeterminate = indeterminate,
    onCheckedChange: groupOnChange = onCheckedChange,
    ...otherGroupProps
  } = groupProps;

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || groupContext?.disabled || disabledProp;

  const { checked, getInputProps, getRootProps } = useCheckboxRoot({
    ...props,
    disabled,
    inputRef,
    checked: groupChecked,
    indeterminate: groupIndeterminate,
    onCheckedChange: groupOnChange,
  });

  const computedChecked = isGrouped ? Boolean(groupChecked) : checked;
  const computedIndeterminate = isGrouped ? groupIndeterminate || indeterminate : indeterminate;

  React.useEffect(() => {
    if (parentContext && name) {
      parentContext.disabledStatesRef.current.set(name, disabled);
    }
  }, [parentContext, disabled, name]);

  const state: CheckboxRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      checked: computedChecked,
      disabled,
      readOnly,
      required,
      indeterminate: computedIndeterminate,
    }),
    [fieldState, computedChecked, disabled, readOnly, required, computedIndeterminate],
  );

  const customStyleHookMapping = useCustomStyleHookMapping(state);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ref: forwardedRef,
    state,
    className,
    customStyleHookMapping,
    extraProps: {
      ...otherProps,
      ...otherGroupProps,
    },
  });

  return (
    <CheckboxRootContext.Provider value={state}>
      {renderElement()}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </CheckboxRootContext.Provider>
  );
});

export namespace CheckboxRoot {
  export interface State extends FieldRoot.State {
    /**
     * Whether the checkbox is currently ticked.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to tick or untick the checkbox.
     */
    readOnly: boolean;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     */
    required: boolean;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     */
    indeterminate: boolean;
  }
  export interface Props
    extends useCheckboxRoot.Parameters,
      Omit<BaseUIComponentProps<'button', State>, 'onChange' | 'value'> {}
}
