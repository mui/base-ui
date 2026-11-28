'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useSetFieldFocused } from '../../internals/field-root-context/useSetFieldFocused';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useFormContext } from '../../internals/form-context/FormContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import type { UseRenderElementParameters } from '../../internals/useRenderElement';
import { useValueChanged } from '../../internals/useValueChanged';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { FieldControl, FieldControlState } from './FieldControl';

/**
 * The behavior of `Field.Control`: its id, value, dirty, filled, focused and touched state, and
 * validation. Components whose value is a plain text input, such as Input, render their own
 * element with these props so they can add their own state.
 */
export function useFieldControl(componentProps: FieldControl.Props): UseFieldControlReturnValue {
  const {
    render,
    className,
    id: idProp,
    name: nameProp,
    value,
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
    setFilled,
    validationMode,
    validation,
  } = useFieldRootContext();
  const { clearErrors, elementRef: formElementRef, submitCountRef } = useFormContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: FieldControlState = {
    ...fieldState,
    disabled,
  };

  const { labelId } = useLabelableContext();

  const id = useLabelableId({ id: idProp });

  const isControlled = value !== undefined;
  // The DOM value is always a string, so dirty comparisons must serialize the controlled value.
  const serializedValue = value == null ? undefined : String(value);

  const getValueFromInput = useStableCallback(() => validation.inputRef.current?.value);

  useRegisterFieldControl(
    validation.inputRef,
    id,
    serializedValue,
    getValueFromInput,
    !disabled,
    nameProp,
  );

  useIsoLayoutEffect(() => {
    const currentValue = serializedValue ?? validation.inputRef.current?.value;
    if (currentValue !== undefined) {
      setFilled(currentValue !== '');
    }
  }, [serializedValue, defaultValue, validation.inputRef, setFilled]);

  useValueChanged(serializedValue, () => {
    if (serializedValue === undefined) {
      return;
    }

    clearErrors(name);
    setDirty(serializedValue !== (validityData.initialValue ?? ''));

    validation.change(serializedValue);
  });

  const inputRef = React.useRef<HTMLElement>(null);
  const setFocused = useSetFieldFocused(disabled, inputRef);
  const enterValidationTimeout = useTimeout();

  const props: UseFieldControlReturnValue['props'] = [
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
        const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
        onValueChange?.(inputValue, details);

        // Controlled values sync from the `value` prop instead, so that a value the consumer
        // rejects or rewrites never reaches the field state.
        if (isControlled) {
          return;
        }

        // `validation.change` reads `markedDirtyRef`, so update dirty before validating.
        setDirty(inputValue !== (validityData.initialValue ?? ''));
        setFilled(inputValue !== '');

        // Workaround for https://github.com/react/react/issues/9023
        if (!event.nativeEvent.defaultPrevented && !details.isCanceled) {
          clearErrors(name);
          validation.change(inputValue);
        }
      },
      onFocus() {
        setFocused(true);
      },
      onBlur(event) {
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          const inputValue = event.currentTarget.value;
          validation.commit(inputValue);

          if (isControlled) {
            // Controlled blur handlers can normalize the value before this microtask runs.
            // A rewrite back to the initial value is a programmatic reset: the field looks
            // pristine, so committing it would only surface `valueMissing` noise.
            queueMicrotask(() => {
              const nextValue = validation.inputRef.current?.value;
              if (
                nextValue !== undefined &&
                nextValue !== inputValue &&
                nextValue !== (validityData.initialValue ?? '')
              ) {
                validation.commit(nextValue);
              }
            });
          }
        }
      },
      onKeyDown(event) {
        if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
          setTouched(true);
          const value = event.currentTarget.value;
          const form = event.currentTarget.form;
          if (form && form === formElementRef.current && !event.defaultPrevented) {
            const input = event.currentTarget;
            const submitCount = submitCountRef.current;

            // Implicit submission runs after keydown. Fall back unless Form handles it first.
            enterValidationTimeout.start(0, () => {
              if (submitCountRef.current === submitCount) {
                validation.commit(input.value);
              }
            });
          } else {
            validation.commit(value);
          }
        }
      },
    },
    elementProps,
    (externalProps) => validation.getValidationProps(disabled, externalProps),
  ];

  return { state, ref: inputRef, props };
}

export interface UseFieldControlReturnValue {
  /**
   * The control's state, to extend with the component's own state.
   */
  state: FieldControlState;
  /**
   * The ref to apply to the rendered element.
   */
  ref: React.RefObject<HTMLElement | null>;
  /**
   * The props to merge onto the rendered element, in order, before any that must override them.
   */
  props: Extract<
    UseRenderElementParameters<FieldControlState, HTMLElement, 'input', undefined>['props'],
    readonly unknown[]
  >;
}
