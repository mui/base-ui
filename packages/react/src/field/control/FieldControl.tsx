'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { fieldValidityMapping } from '../utils/constants';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useField } from '../useField';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { activeElement } from '../../floating-ui-react/utils';

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
  forwardedRef: React.ForwardedRef<HTMLElement>,
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
    autoFocus = false,
    ...elementProps
  } = componentProps;

  const {
    state: fieldState,
    name: fieldName,
    disabled: fieldDisabled,
    setTouched,
    setDirty,
    validityData,
    setFocused,
    setFilled,
    validationMode,
    validation,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: FieldControl.State = {
    ...fieldState,
    disabled,
  };

  const { labelId } = useLabelableContext();

  const id = useLabelableId({ id: idProp });

  useIsoLayoutEffect(() => {
    const hasExternalValue = valueProp != null;
    if (validation.inputRef.current?.value || (hasExternalValue && valueProp !== '')) {
      setFilled(true);
    } else if (hasExternalValue && valueProp === '') {
      setFilled(false);
    }
  }, [validation.inputRef, setFilled, valueProp]);

  const inputRef = React.useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    if (autoFocus && inputRef.current === activeElement(ownerDocument(inputRef.current))) {
      setFocused(true);
    }
  }, [autoFocus, setFocused]);

  const [valueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'FieldControl',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueUnwrapped : undefined;

  useField({
    id,
    name,
    commit: validation.commit,
    value,
    getValue: () => validation.inputRef.current?.value,
    controlRef: validation.inputRef,
  });

  const element = useRenderElement('input', componentProps, {
    ref: [forwardedRef, inputRef],
    state,
    props: [
      {
        id,
        disabled,
        name,
        ref: validation.inputRef,
        'aria-labelledby': labelId,
        autoFocus,
        ...(isControlled ? { value } : { defaultValue }),
        onChange(event) {
          const inputValue = event.currentTarget.value;
          onValueChange?.(inputValue, createChangeEventDetails(REASONS.none, event.nativeEvent));
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
            validation.commit(event.currentTarget.value);
          }
        },
        onKeyDown(event) {
          if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
            setTouched(true);
            validation.commit(event.currentTarget.value);
          }
        },
      },
      validation.getInputValidationProps(),
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
  onValueChange?:
    | ((value: string, eventDetails: FieldControl.ChangeEventDetails) => void)
    | undefined;
  defaultValue?: React.ComponentProps<'input'>['defaultValue'] | undefined;
}

export type FieldControlChangeEventReason = typeof REASONS.none;

export type FieldControlChangeEventDetails =
  BaseUIChangeEventDetails<FieldControl.ChangeEventReason>;

export namespace FieldControl {
  export type State = FieldControlState;
  export type Props = FieldControlProps;
  export type ChangeEventReason = FieldControlChangeEventReason;
  export type ChangeEventDetails = FieldControlChangeEventDetails;
}
