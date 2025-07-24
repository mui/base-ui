'use client';
import * as React from 'react';
import { useForkRef } from '@base-ui-components/utils/useForkRef';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { NOOP } from '../../utils/noop';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import { RadioRootContext } from './RadioRootContext';
import { EMPTY_OBJECT } from '../../utils/constants';

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
    registerControlRef,
  } = useRadioGroupContext();

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledRoot || disabledProp;
  const readOnly = readOnlyRoot || readOnlyProp;
  const required = requiredRoot || requiredProp;

  const { setDirty, validityData, setTouched: setFieldTouched, setFilled } = useFieldRootContext();

  const checked = checkedValue === value;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useForkRef(inputRefProp, inputRef);

  useIsoLayoutEffect(() => {
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
    native: nativeButton,
    name: 'Radio.Root',
  });

  const id = useBaseUiId();

  const inputProps: React.ComponentPropsWithRef<'input'> = React.useMemo(
    () => ({
      type: 'radio',
      ref,
      // Set `id` to stop Chrome warning about an unassociated input
      id,
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
      checked,
      disabled,
      id,
      onValueChange,
      readOnly,
      ref,
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

  const refs = [forwardedRef, registerControlRef, buttonRef];
  const props = [
    rootProps,
    fieldControlValidation?.getValidationProps ?? EMPTY_OBJECT,
    elementProps,
    getButtonProps,
  ];

  const element = useRenderElement('button', componentProps, {
    enabled: !isRadioGroup,
    state,
    ref: refs,
    props,
    customStyleHookMapping,
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
          customStyleHookMapping={customStyleHookMapping}
        />
      ) : (
        element
      )}
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
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }

  export interface State extends FieldRoot.State {
    /**
     * Whether the radio button is currently selected.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
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
