'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { fieldValidityMapping } from '../field/utils/constants';
import { BaseUIComponentProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';
import { useField } from '../field/useField';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import {
  BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../utils/createBaseUIEventDetails';

/**
 * A native textarea element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<textarea>` element.
 *
 * Documentation: [Base UI Textarea](https://base-ui.com/react/components/textarea)
 */
export const Textarea = React.forwardRef(function Textarea(
  componentProps: Textarea.Props,
  forwardedRef: React.ForwardedRef<HTMLTextAreaElement>,
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
    minRows,
    maxRows,
    style,
    ...elementProps
  } = componentProps;

  const { state: fieldState, name: fieldName, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: Textarea.State = React.useMemo(
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

  useIsoLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

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
    name: 'Textarea',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;

  const setValue = useEventCallback(
    (nextValue: string, eventDetails: Textarea.ChangeEventDetails) => {
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

  useIsoLayoutEffect(() => {
    const el = inputRef.current;
    if (!el || (minRows == null && maxRows == null)) {
      return undefined;
    }

    const resize = () => {
      el.style.height = 'auto';
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
      const min = minRows != null ? minRows * lineHeight : 0;
      const maxPx = maxRows != null ? maxRows * lineHeight : Infinity;
      const target = Math.min(maxPx, Math.max(min, el.scrollHeight));
      el.style.height = `${target}px`;
      el.style.overflowY = el.scrollHeight > target ? 'auto' : 'hidden';
    };

    resize();
    el.addEventListener('input', resize);
    window.addEventListener('resize', resize);

    return () => {
      el.removeEventListener('input', resize);
      window.removeEventListener('resize', resize);
    };
  }, [inputRef, minRows, maxRows]);

  const element = useRenderElement('textarea', componentProps, {
    ref: forwardedRef || undefined,
    state,
    props: [
      {
        id,
        disabled,
        name,
        ref: inputRef,
        ...(minRows != null ? { rows: minRows } : {}),
        'aria-labelledby': labelId,
        ...(minRows != null && !(style as any)?.height
          ? {
              style: {
                ...(style as React.CSSProperties),
                height: `${minRows * 24}px`,
                resize: 'none',
              },
            }
          : { style }),
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
        onBlur(event: React.FocusEvent<HTMLTextAreaElement>) {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            commitValidation(event.currentTarget.value);
          }
        },
        onKeyDown(event) {
          if (
            event.currentTarget.tagName === 'TEXTAREA' &&
            event.key === 'Enter' &&
            event.shiftKey === true
          ) {
            setTouched(true);
            commitValidation(event.currentTarget.value);
          }
        },
      },
      getValidationProps(),
      getInputValidationProps(),
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export namespace Textarea {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'textarea', State> {
    /**
     * Enable automatic height resizing by setting the minimum number of rows.
     *
     * Prefer the CSS property `field-sizing: content` when supported (not
     * supported in Safari and Firefox).
     */
    minRows?: number;
    /**
     * Limit automatic height resizing to this many rows.
     */
    maxRows?: number;
    /**
     * Callback fired when the `value` changes. Use when controlled.
     */
    onValueChange?: (value: string, eventDetails: ChangeEventDetails) => void;
    defaultValue?: React.ComponentProps<'textarea'>['defaultValue'];
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason>;
}
