'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useButton } from '../../use-button';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';
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
    ...elementProps
  } = componentProps;

  const {
    disabled: disabledRoot,
    readOnly: readOnlyRoot,
    required: requiredRoot,
    checkedValue,
    setCheckedValue,
    onValueChange,
    touched,
    setTouched,
    fieldControlValidation,
  } = useRadioGroupContext();

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledRoot || disabledProp;
  const readOnly = readOnlyRoot || readOnlyProp;
  const required = requiredRoot || requiredProp;

  const { setDirty, validityData, setTouched: setFieldTouched, setFilled } = useFieldRootContext();

  const checked = checkedValue === value;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useForkRef(inputRefProp, inputRef);

  useModernLayoutEffect(() => {
    if (inputRef.current?.checked) {
      setFilled(true);
    }
  }, [setFilled]);

  const rootProps: React.ComponentPropsWithRef<'button'> = React.useMemo(
    () => ({
      role: 'radio',
      'aria-checked': checked,
      'aria-required': required || undefined,
      'aria-disabled': disabled || undefined,
      'aria-readonly': readOnly || undefined,
      [ACTIVE_COMPOSITE_ITEM as string]: checked ? '' : undefined,
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
    }),
    [checked, required, disabled, readOnly, touched, setTouched],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
  });

  const inputProps: React.ComponentPropsWithRef<'input'> = React.useMemo(
    () => ({
      type: 'radio',
      ref,
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

        setFieldTouched(true);
        setDirty(value !== validityData.initialValue);
        setCheckedValue(value);
        setFilled(true);
        onValueChange?.(value, event.nativeEvent);
      },
    }),
    [
      disabled,
      checked,
      required,
      readOnly,
      value,
      setFieldTouched,
      setDirty,
      validityData.initialValue,
      setCheckedValue,
      setFilled,
      onValueChange,
      ref,
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

  const renderElement = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      rootProps,
      fieldControlValidation?.getValidationProps ?? NOOP,
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping,
  });

  return (
    <RadioRootContext.Provider value={contextValue}>
      {setCheckedValue === NOOP ? renderElement() : <CompositeItem render={renderElement()} />}
      <input {...inputProps} />
    </RadioRootContext.Provider>
  );
});

export namespace RadioRoot {
  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'value'> {
    /**
     * The unique identifying value of the radio in a group.
     */
    value: any;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the user should be unable to select the radio button.
     * @default false
     */
    readOnly?: boolean;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }

  export interface State {
    /**
     * Whether the radio button is currently selected.
     */
    checked: boolean;
    disabled: boolean;
    /**
     * Whether the user should be unable to select the radio button.
     */
    readOnly: boolean;
    /**
     * Whether the user must choose a value before submitting a form.
     */
    required: boolean;
  }
}
