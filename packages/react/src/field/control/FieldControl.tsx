'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldControl } from './useFieldControl';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * The form control to label and validate.
 * Renders an `<input>` element.
 *
 * You can omit this part and use any Base UI input component instead. For example,
 * [Input](https://base-ui.com/react/components/input), [Checkbox](https://base-ui.com/react/components/checkbox),
 * or [Select](https://base-ui.com/react/components/select), among others, will work with Field out of the box.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldControl = React.forwardRef(function FieldControl(
  props: FieldControl.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    render,
    className,
    id,
    name: nameProp,
    value,
    disabled: disabledProp = false,
    onValueChange,
    defaultValue,
    ...otherProps
  } = props;

  const { state: fieldState, name: fieldName, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: FieldControl.State = React.useMemo(
    () => ({ ...fieldState, disabled }),
    [fieldState, disabled],
  );

  const { getControlProps } = useFieldControl({
    id,
    name,
    disabled,
    value,
    defaultValue,
    onValueChange,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getControlProps,
    render: render ?? 'input',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  return renderElement();
});

export namespace FieldControl {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * Callback fired when the `value` changes. Use when controlled.
     */
    onValueChange?: (value: React.ComponentProps<'input'>['value'], event: Event) => void;
    defaultValue?: React.ComponentProps<'input'>['defaultValue'];
  }
}
