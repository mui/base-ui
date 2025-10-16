'use client';
import * as React from 'react';
import { useUntrackedCallback } from '@base-ui-components/utils/useUntrackedCallback';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { fieldValidityMapping } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useField } from '../useField';
import { useFieldControlValidation } from './useFieldControlValidation';
import {
  BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';

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

  const { setTouched, setDirty, validityData, setFocused, setFilled, validationMode } =
    useFieldRootContext();
  const { labelId } = useLabelableContext();

  const { getInputValidationProps, commitValidation, inputRef } = useFieldControlValidation();

  const id = useLabelableId({ id: idProp });

  useIsoLayoutEffect(() => {
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

  const isControlled = valueProp !== undefined;

  const setValue = useUntrackedCallback(
    (nextValue: string, eventDetails: FieldControl.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  useField({
    id,
    name,
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
        ...(isControlled ? { value } : { defaultValue }),
        onChange(event) {
          const inputValue = event.currentTarget.value;
          setValue(inputValue, createChangeEventDetails('none', event.nativeEvent));
          setDirty(inputValue !== validityData.initialValue);
          setFilled(inputValue !== '');
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
      getInputValidationProps(),
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export type FieldControlState = FieldRoot.State;

export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControl.State> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?: (value: string, eventDetails: FieldControl.ChangeEventDetails) => void;
  defaultValue?: React.ComponentProps<'input'>['defaultValue'];
}

export type FieldControlChangeEventReason = 'none';

export type FieldControlChangeEventDetails =
  BaseUIChangeEventDetails<FieldControl.ChangeEventReason>;

export namespace FieldControl {
  export type State = FieldControlState;
  export type Props = FieldControlProps;
  export type ChangeEventReason = FieldControlChangeEventReason;
  export type ChangeEventDetails = FieldControlChangeEventDetails;
}
