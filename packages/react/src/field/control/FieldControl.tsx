'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { type FieldRootState } from '../root/FieldRoot';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useFormContext } from '../../internals/form-context/FormContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
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
    style,
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
  const { clearErrors } = useFormContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: FieldControlState = {
    ...fieldState,
    disabled,
  };

  const { labelId } = useLabelableContext();

  const id = useLabelableId({ id: idProp });

  const inputRef = React.useRef<HTMLInputElement>(null);

  // The field's `filled` state belongs to whichever control currently owns the shared input ref,
  // which is the last one to attach. Publishing it unconditionally stops a fresh control from
  // inheriting the state of the control it replaced, while the ownership check stops a
  // superseded control from clearing the active one's state when it rerenders. A null ref means
  // the owner unmounted, so the next control to get here reclaims it.
  useIsoLayoutEffect(() => {
    if (validation.inputRef.current !== null && validation.inputRef.current !== inputRef.current) {
      return;
    }

    validation.inputRef.current = inputRef.current;
    setFilled(valueProp != null ? valueProp !== '' : Boolean(inputRef.current?.value));
  }, [validation.inputRef, setFilled, valueProp]);

  const focusedRef = React.useRef(false);

  const updateFocused = useStableCallback((focused: boolean) => {
    focusedRef.current = focused;
    setFocused(focused);
  });

  // A control removed while focused never fires blur, which would leave the field focused
  // forever. Only release the state when this control is the one still holding it.
  useIsoLayoutEffect(
    () => () => {
      if (focusedRef.current) {
        setFocused(false);
      }
    },
    [setFocused],
  );

  useIsoLayoutEffect(() => {
    if (autoFocus && inputRef.current === activeElement(ownerDocument(inputRef.current))) {
      updateFocused(true);
    }
  }, [autoFocus, updateFocused]);

  const [valueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'FieldControl',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueUnwrapped : undefined;
  // Read this control's own element, not the mutable shared ref, so the active registration
  // stays readable regardless of which control last touched the shared ref.
  const getValueFromInput = useStableCallback(() => inputRef.current?.value);

  useRegisterFieldControl(inputRef, id, value, getValueFromInput, !disabled, nameProp);

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
          // `validation.change` reads `markedDirtyRef`, so update dirty before validating.
          setDirty(inputValue !== (validityData.initialValue ?? ''));
          setFilled(inputValue !== '');

          // Workaround for https://github.com/react/react/issues/9023
          if (!event.nativeEvent.defaultPrevented) {
            clearErrors(name);
            validation.change(inputValue);
          }
        },
        onFocus() {
          updateFocused(true);
        },
        onBlur(event) {
          setTouched(true);
          updateFocused(false);

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
      elementProps,
      (props) => validation.getValidationProps(disabled, props),
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export interface FieldControlState extends FieldRootState {}

export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControlState> {
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
