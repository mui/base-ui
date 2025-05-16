'use client';
import * as React from 'react';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useEventCallback } from '../../utils/useEventCallback';
import { useField } from '../useField';
import { useControlled, useModernLayoutEffect } from '../../utils';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useFieldControlValidation } from './useFieldControlValidation';

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
  componentProps: FieldControl.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    render,
    className,
    id: idProp,
    name: nameProp,
    value: valueProp,
    disabled: disabledProp = false,
    onValueChange,
    defaultValue,
    ...elementProps
  } = componentProps;

  const { state: fieldState, name: fieldName, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: FieldControl.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
    }),
    [fieldState, disabled],
  );

  const {
    setControlId,
    labelId,
    setTouched,
    setDirty,
    validityData,
    setFocused,
    setFilled,
    validationMode,
  } = useFieldRootContext();

  const { getValidationProps, getInputValidationProps, commitValidation, inputRef } =
    useFieldControlValidation();

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useModernLayoutEffect(() => {
    const hasExternalValue = valueProp != null;
    if (inputRef.current?.value || (hasExternalValue && valueProp !== '')) {
      setFilled(true);
    } else if (hasExternalValue && valueProp === '') {
      setFilled(false);
    }
  }, [inputRef, setFilled, valueProp]);

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'FieldControl',
    state: 'value',
  });

  const setValue = useEventCallback(
    (nextValue: string | number | readonly string[], event: Event) => {
      setValueUnwrapped(nextValue);
      onValueChange?.(nextValue, event);
    },
  );

  useField({
    id,
    commitValidation,
    value,
    getValue: () => inputRef.current?.value,
    controlRef: inputRef,
  });

  const element = useRenderElement('input', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        id,
        disabled,
        name,
        ref: inputRef,
        'aria-labelledby': labelId,
        value,
        onChange(event) {
          if (value != null) {
            setValue(event.currentTarget.value, event.nativeEvent);
          }

          setDirty(event.currentTarget.value !== validityData.initialValue);
          setFilled(event.currentTarget.value !== '');
        },
        onFocus() {
          setFocused(true);
        },
        onBlur(event) {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            commitValidation(event.currentTarget.value);
          }
        },
        onKeyDown(event) {
          if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
            setTouched(true);
            commitValidation(event.currentTarget.value);
          }
        },
      },
      getValidationProps(),
      getInputValidationProps(),
      elementProps,
    ],
    customStyleHookMapping: fieldValidityMapping,
  });

  return element;
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
