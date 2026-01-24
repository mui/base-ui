'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useRenderElement } from '../utils/useRenderElement';
import { CheckboxGroupContext } from './CheckboxGroupContext';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useLabelableContext } from '../labelable-provider/LabelableContext';
import type { BaseUIComponentProps } from '../utils/types';
import { fieldValidityMapping } from '../field/utils/constants';
import { useField } from '../field/useField';
import { PARENT_CHECKBOX } from '../checkbox/root/CheckboxRoot';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';
import { REASONS } from '../utils/reasons';
import { useFormContext } from '../form/FormContext';
import { useValueChanged } from '../utils/useValueChanged';
import { areArraysEqual } from '../utils/areArraysEqual';
import { EMPTY_ARRAY } from '../utils/constants';

/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
export const CheckboxGroup = React.forwardRef(function CheckboxGroup(
  componentProps: CheckboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    allValues,
    className,
    defaultValue,
    disabled: disabledProp = false,
    id: idProp,
    onValueChange,
    render,
    value: externalValue,
    ...elementProps
  } = componentProps;

  const {
    disabled: fieldDisabled,
    name: fieldName,
    state: fieldState,
    validation,
    setFilled,
    setDirty,
    shouldValidateOnChange,
    validityData,
  } = useFieldRootContext();
  const { labelId, getDescriptionProps } = useLabelableContext();
  const { clearErrors } = useFormContext();

  const disabled = fieldDisabled || disabledProp;

  const [value, setValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value',
  });

  const setValue = useStableCallback(
    (v: string[], eventDetails: CheckboxGroup.ChangeEventDetails) => {
      onValueChange?.(v, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(v);
    },
  );

  const parent = useCheckboxGroupParent({
    allValues,
    value: externalValue,
    onValueChange,
  });

  const id = useBaseUiId(idProp);

  const controlRef = React.useRef<HTMLButtonElement>(null);

  const registerControlRef = React.useCallback((element: HTMLButtonElement | null) => {
    if (controlRef.current == null && element != null && !element.hasAttribute(PARENT_CHECKBOX)) {
      controlRef.current = element;
    }
  }, []);

  useField({
    enabled: !!fieldName,
    id,
    commit: validation.commit,
    value,
    controlRef,
    name: fieldName,
    getValue: () => value,
  });

  const resolvedValue = value ?? EMPTY_ARRAY;

  useValueChanged(resolvedValue, () => {
    if (fieldName) {
      clearErrors(fieldName);
    }

    const initialValue = Array.isArray(validityData.initialValue)
      ? (validityData.initialValue as readonly string[])
      : EMPTY_ARRAY;

    setFilled(resolvedValue.length > 0);
    setDirty(!areArraysEqual(resolvedValue, initialValue));

    if (shouldValidateOnChange()) {
      validation.commit(resolvedValue);
    } else {
      validation.commit(resolvedValue, true);
    }
  });

  const state: CheckboxGroup.State = {
    ...fieldState,
    disabled,
  };

  const contextValue: CheckboxGroupContext = React.useMemo(
    () => ({
      allValues,
      value,
      defaultValue,
      setValue,
      parent,
      disabled,
      validation,
      registerControlRef,
    }),
    [allValues, value, defaultValue, setValue, parent, disabled, validation, registerControlRef],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
      },
      getDescriptionProps,
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return (
    <CheckboxGroupContext.Provider value={contextValue}>{element}</CheckboxGroupContext.Provider>
  );
});

export interface CheckboxGroupState extends FieldRoot.State {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface CheckboxGroupProps extends BaseUIComponentProps<'div', CheckboxGroup.State> {
  /**
   * Names of the checkboxes in the group that should be ticked.
   *
   * To render an uncontrolled checkbox group, use the `defaultValue` prop instead.
   */
  value?: string[] | undefined;
  /**
   * Names of the checkboxes in the group that should be initially ticked.
   *
   * To render a controlled checkbox group, use the `value` prop instead.
   */
  defaultValue?: string[] | undefined;
  /**
   * Event handler called when a checkbox in the group is ticked or unticked.
   * Provides the new value as an argument.
   */
  onValueChange?:
    | ((value: string[], eventDetails: CheckboxGroupChangeEventDetails) => void)
    | undefined;
  /**
   * Names of all checkboxes in the group. Use this when creating a parent checkbox.
   */
  allValues?: string[] | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type CheckboxGroupChangeEventReason = typeof REASONS.none;
export type CheckboxGroupChangeEventDetails =
  BaseUIChangeEventDetails<CheckboxGroup.ChangeEventReason>;

export namespace CheckboxGroup {
  export type State = CheckboxGroupState;
  export type Props = CheckboxGroupProps;
  export type ChangeEventReason = CheckboxGroupChangeEventReason;
  export type ChangeEventDetails = CheckboxGroupChangeEventDetails;
}
