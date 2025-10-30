'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { EMPTY_OBJECT } from '../../utils/constants';
import { NOOP } from '../../utils/noop';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldItemContext } from '../../field/item/FieldItemContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import { RadioRootContext } from './RadioRootContext';

/**
 * Represents the radio button itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export const RadioRoot = React.forwardRef(function RadioRoot(
  componentProps: RadioRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    readOnly: readOnlyProp = false,
    required: requiredProp = false,
    value,
    inputRef: inputRefProp,
    nativeButton = true,
    id: idProp,
    ...elementProps
  } = componentProps;

  const {
    disabled: disabledGroup,
    readOnly: readOnlyGroup,
    required: requiredGroup,
    checkedValue,
    setCheckedValue,
    touched,
    setTouched,
    fieldControlValidation,
    registerControlRef,
  } = useRadioGroupContext();

  const {
    setDirty,
    validityData,
    setTouched: setFieldTouched,
    setFilled,
    state: fieldState,
    disabled: fieldDisabled,
  } = useFieldRootContext();
  const fieldItemContext = useFieldItemContext();
  const { getDescriptionProps } = useLabelableContext();

  const disabled = fieldDisabled || fieldItemContext.disabled || disabledGroup || disabledProp;
  const readOnly = readOnlyGroup || readOnlyProp;
  const required = requiredGroup || requiredProp;

  const checked = checkedValue === value;

  const radioRef = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useMergedRefs(inputRefProp, inputRef);

  useIsoLayoutEffect(() => {
    if (inputRef.current?.checked) {
      setFilled(true);
    }
  }, [setFilled]);

  const id = useLabelableId({
    id: idProp,
    implicit: true,
    controlRef: radioRef,
  });

  const rootProps: React.ComponentProps<'button'> = {
    role: 'radio',
    'aria-checked': checked,
    'aria-required': required || undefined,
    'aria-disabled': disabled || undefined,
    'aria-readonly': readOnly || undefined,
    [ACTIVE_COMPOSITE_ITEM as string]: checked ? '' : undefined,
    id: id ?? undefined,
    disabled,
    onKeyDown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    },
    onClick(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      event.preventDefault();

      inputRef.current?.click();
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled || readOnly || !touched) {
        return;
      }

      inputRef.current?.click();

      setTouched(false);
    },
  };

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const inputId = useBaseUiId();

  const inputProps: React.ComponentPropsWithRef<'input'> = React.useMemo(
    () => ({
      type: 'radio',
      ref: mergedInputRef,
      // Set `id` to stop Chrome warning about an unassociated input
      id: inputId,
      tabIndex: -1,
      style: visuallyHidden,
      'aria-hidden': true,
      disabled,
      checked,
      required,
      readOnly,
      onChange(event) {
        // Workaround for https://github.com/facebook/react/issues/9023
        if (event.nativeEvent.defaultPrevented) {
          return;
        }

        if (disabled || readOnly || value === undefined) {
          return;
        }

        const details = createChangeEventDetails('none', event.nativeEvent);

        if (details.isCanceled) {
          return;
        }

        setFieldTouched(true);
        setDirty(value !== validityData.initialValue);
        setFilled(true);
        setCheckedValue(value, details);
      },
    }),
    [
      checked,
      disabled,
      inputId,
      mergedInputRef,
      readOnly,
      required,
      setCheckedValue,
      setDirty,
      setFieldTouched,
      setFilled,
      validityData.initialValue,
      value,
    ],
  );

  const state: RadioRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      required,
      disabled,
      readOnly,
      checked,
    }),
    [fieldState, disabled, readOnly, checked, required],
  );

  const contextValue: RadioRootContext = React.useMemo(() => state, [state]);

  const isRadioGroup = setCheckedValue !== NOOP;

  const refs = [forwardedRef, registerControlRef, radioRef, buttonRef];
  const props = [
    rootProps,
    getDescriptionProps,
    fieldControlValidation?.getValidationProps ?? EMPTY_OBJECT,
    elementProps,
    getButtonProps,
  ];

  const element = useRenderElement('button', componentProps, {
    enabled: !isRadioGroup,
    state,
    ref: refs,
    props,
    stateAttributesMapping,
  });

  return (
    <RadioRootContext.Provider value={contextValue}>
      {isRadioGroup ? (
        <CompositeItem
          tag="button"
          render={render}
          className={className}
          state={state}
          refs={refs}
          props={props}
          stateAttributesMapping={stateAttributesMapping}
        />
      ) : (
        element
      )}
      <input {...inputProps} />
    </RadioRootContext.Provider>
  );
});

export interface RadioRootState extends FieldRoot.State {
  /** Whether the radio button is currently selected. */
  checked: boolean;
  /** Whether the component should ignore user interaction. */
  disabled: boolean;
  /** Whether the user should be unable to select the radio button. */
  readOnly: boolean;
  /** Whether the user must choose a value before submitting a form. */
  required: boolean;
}
export interface RadioRootProps
  extends NativeButtonProps,
    Omit<BaseUIComponentProps<'button', RadioRoot.State>, 'value'> {
  /** The unique identifying value of the radio in a group. */
  value: any;
  /** Whether the component should ignore user interaction. */
  disabled?: boolean;
  /** Whether the user must choose a value before submitting a form. */
  required?: boolean;
  /** Whether the user should be unable to select the radio button. */
  readOnly?: boolean;
  /** A ref to access the hidden input element. */
  inputRef?: React.Ref<HTMLInputElement>;
}

export namespace RadioRoot {
  export type State = RadioRootState;
  export type Props = RadioRootProps;
}
