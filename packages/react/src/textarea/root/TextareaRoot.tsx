'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { type FieldRootState } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { activeElement } from '../../floating-ui-react/utils';
import { useAutoResize } from '../utils/useAutoResize';

/**
 * A textarea element with auto-resize support that automatically works with
 * [Field](https://base-ui.com/react/components/field).
 * Renders a `<textarea>` element.
 *
 * Documentation: [Base UI Textarea](https://base-ui.com/react/components/textarea)
 */
export const TextareaRoot = React.forwardRef(function TextareaRoot(
  componentProps: TextareaRoot.Props,
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
    autoFocus = false,
    autoResize = true,
    minRows = 1,
    maxRows,
    maxLength,
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

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: TextareaRootState = {
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

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useIsoLayoutEffect(() => {
    if (autoFocus && textareaRef.current === activeElement(ownerDocument(textareaRef.current))) {
      setFocused(true);
    }
  }, [autoFocus, setFocused]);

  const [valueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? '',
    name: 'TextareaRoot',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueUnwrapped : undefined;
  const getFieldValue = useStableCallback(() => validation.inputRef.current?.value);

  useRegisterFieldControl(validation.inputRef, {
    id,
    value,
    getValue: getFieldValue,
  });

  const { syncHeight, getTextareaStyles } = useAutoResize({
    enabled: autoResize,
    minRows,
    maxRows,
    textareaRef,
  });

  const handleChange = useStableCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.currentTarget.value;
    onValueChange?.(inputValue, createChangeEventDetails(REASONS.none, event.nativeEvent));
    setDirty(inputValue !== validityData.initialValue);
    setFilled(inputValue !== '');
    syncHeight();
  });

  const autoResizeStyles = getTextareaStyles();

  const element = useRenderElement('textarea', componentProps, {
    ref: [forwardedRef, textareaRef],
    state,
    props: [
      {
        id,
        disabled,
        name,
        ref: validation.inputRef as React.RefObject<HTMLTextAreaElement | null>,
        'aria-labelledby': labelId,
        autoFocus,
        maxLength,
        ...(isControlled ? { value } : { defaultValue: defaultValue ?? '' }),
        onChange: handleChange,
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
        style: {
          ...autoResizeStyles,
          ...style,
        },
      },
      validation.getInputValidationProps(),
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export interface TextareaRootState extends FieldRootState {}

export interface TextareaRootProps
  extends BaseUIComponentProps<'textarea', TextareaRootState> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?:
    | ((value: string, eventDetails: TextareaRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * The default value of the textarea. Use when uncontrolled.
   */
  defaultValue?: string | undefined;
  /**
   * The value of the textarea. Use when controlled.
   */
  value?: string | undefined;
  /**
   * Whether the textarea automatically resizes to fit its content.
   * Uses CSS `field-sizing: content` where supported, with a JS fallback.
   * @default true
   */
  autoResize?: boolean | undefined;
  /**
   * Minimum number of rows to display.
   * @default 1
   */
  minRows?: number | undefined;
  /**
   * Maximum number of rows to display. When content exceeds this, the textarea
   * becomes scrollable.
   */
  maxRows?: number | undefined;
  /**
   * Maximum number of characters. When set, the native `maxlength` attribute
   * is applied and the value is exposed to `Textarea.CharacterCount`.
   */
  maxLength?: number | undefined;
}

export type TextareaRootChangeEventReason = typeof REASONS.none;

export type TextareaRootChangeEventDetails =
  BaseUIChangeEventDetails<TextareaRoot.ChangeEventReason>;

export namespace TextareaRoot {
  export type State = TextareaRootState;
  export type Props = TextareaRootProps;
  export type ChangeEventReason = TextareaRootChangeEventReason;
  export type ChangeEventDetails = TextareaRootChangeEventDetails;
}
