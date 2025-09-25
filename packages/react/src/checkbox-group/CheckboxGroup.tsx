'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useRenderElement } from '../utils/useRenderElement';
import { CheckboxGroupContext } from './CheckboxGroupContext';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useLabelableContext } from '../field/root/LabelableContext';
import type { BaseUIComponentProps } from '../utils/types';
import { fieldValidityMapping } from '../field/utils/constants';
import { useField } from '../field/useField';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { PARENT_CHECKBOX } from '../checkbox/root/CheckboxRoot';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';
import { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';

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

  const { disabled: fieldDisabled, name: fieldName, state: fieldState } = useFieldRootContext();
  const { labelId } = useLabelableContext();

  const disabled = fieldDisabled || disabledProp;

  const fieldControlValidation = useFieldControlValidation();

  const [value, setValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value',
  });

  const setValue = useEventCallback(
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
    commitValidation: fieldControlValidation.commitValidation,
    value,
    controlRef,
    name: fieldName,
    getValue: () => value,
  });

  const state: CheckboxGroup.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
    }),
    [fieldState, disabled],
  );

  const contextValue: CheckboxGroupContext = React.useMemo(
    () => ({
      allValues,
      value,
      defaultValue,
      setValue,
      parent,
      disabled,
      fieldControlValidation,
      registerControlRef,
    }),
    [
      allValues,
      value,
      defaultValue,
      setValue,
      parent,
      disabled,
      fieldControlValidation,
      registerControlRef,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
      },
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
  value?: string[];
  /**
   * Names of the checkboxes in the group that should be initially ticked.
   *
   * To render a controlled checkbox group, use the `value` prop instead.
   */
  defaultValue?: string[];
  /**
   * Event handler called when a checkbox in the group is ticked or unticked.
   * Provides the new value as an argument.
   */
  onValueChange?: (value: string[], eventDetails: CheckboxGroupChangeEventDetails) => void;
  /**
   * Names of all checkboxes in the group. Use this when creating a parent checkbox.
   */
  allValues?: string[];
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
}

export type CheckboxGroupChangeEventReason = 'none';
export type CheckboxGroupChangeEventDetails =
  BaseUIChangeEventDetails<CheckboxGroup.ChangeEventReason>;

export namespace CheckboxGroup {
  export type State = CheckboxGroupState;
  export type Props = CheckboxGroupProps;
  export type ChangeEventReason = CheckboxGroupChangeEventReason;
  export type ChangeEventDetails = CheckboxGroupChangeEventDetails;
}
