'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useStateAttributesMapping } from '../utils/useStateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { CheckboxRootContext } from './CheckboxRootContext';
import {
  BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';

const EMPTY = {};
export const PARENT_CHECKBOX = 'data-parent';

/**
 * Represents the checkbox itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxRoot = React.forwardRef(function CheckboxRoot(
  componentProps: CheckboxRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    checked: checkedProp,
    className,
    defaultChecked = false,
    disabled: disabledProp = false,
    id: idProp,
    indeterminate = false,
    inputRef: inputRefProp,
    name: nameProp,
    onCheckedChange: onCheckedChangeProp,
    parent = false,
    readOnly = false,
    render,
    required = false,
    value: valueProp,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { clearErrors } = useFormContext();
  const {
    disabled: fieldDisabled,
    labelId,
    name: fieldName,
    setControlId,
    setDirty,
    setFilled,
    setFocused,
    setTouched,
    state: fieldState,
    validationMode,
    validityData,
  } = useFieldRootContext();

  const groupContext = useCheckboxGroupContext();
  const parentContext = groupContext?.parent;
  const isGrouped = parentContext && groupContext.allValues;

  const disabled = fieldDisabled || groupContext?.disabled || disabledProp;
  const name = fieldName ?? nameProp;
  const value = valueProp ?? name;

  let groupProps: Partial<Omit<CheckboxRoot.Props, 'className'>> = {};
  if (isGrouped) {
    if (parent) {
      groupProps = groupContext.parent.getParentProps();
    } else if (value) {
      groupProps = groupContext.parent.getChildProps(value);
    }
  }

  const onCheckedChange = useEventCallback(onCheckedChangeProp);

  const {
    checked: groupChecked = checkedProp,
    indeterminate: groupIndeterminate = indeterminate,
    onCheckedChange: groupOnChange,
    ...otherGroupProps
  } = groupProps;

  const groupValue = groupContext?.value;
  const setGroupValue = groupContext?.setValue;
  const defaultGroupValue = groupContext?.defaultValue;

  const controlRef = React.useRef<HTMLButtonElement>(null);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const localFieldControlValidation = useFieldControlValidation();
  const fieldControlValidation =
    groupContext?.fieldControlValidation ?? localFieldControlValidation;

  const [checked, setCheckedState] = useControlled({
    controlled: value && groupValue && !parent ? groupValue.includes(value) : groupChecked,
    default:
      value && defaultGroupValue && !parent ? defaultGroupValue.includes(value) : defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    const element = controlRef?.current;
    if (!element) {
      return undefined;
    }

    if (groupContext) {
      setControlId(idProp ?? null);
    } else if (element.closest('label') == null) {
      setControlId(id);
    }

    return () => {
      setControlId(undefined);
    };
  }, [groupContext, id, idProp, setControlId]);

  useField({
    enabled: !groupContext,
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value: checked,
    controlRef,
    name,
    getValue: () => checked,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useMergedRefs(inputRefProp, inputRef, fieldControlValidation.inputRef);

  useIsoLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = groupIndeterminate;
      if (checked) {
        setFilled(true);
      }
    }
  }, [checked, groupIndeterminate, setFilled]);

  function onFocus() {
    setFocused(true);
  }

  function onBlur() {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    setTouched(true);
    setFocused(false);

    if (validationMode === 'onBlur') {
      fieldControlValidation.commitValidation(groupContext ? groupValue : element.checked);
    }
  }

  function onClick(event: React.MouseEvent) {
    if (event.defaultPrevented || readOnly) {
      return;
    }

    event.preventDefault();

    inputRef.current?.click();
  }

  const inputProps = mergeProps<'input'>(
    {
      checked,
      disabled,
      // parent checkboxes unset `name` to be excluded from form submission
      name: parent ? undefined : name,
      // Set `id` to stop Chrome warning about an unassociated input
      id: `${id}-input`,
      required,
      ref: mergedInputRef,
      style: visuallyHidden,
      tabIndex: -1,
      type: 'checkbox',
      'aria-hidden': true,
      onChange(event) {
        // Workaround for https://github.com/facebook/react/issues/9023
        if (event.nativeEvent.defaultPrevented) {
          return;
        }

        const nextChecked = event.target.checked;
        const details = createChangeEventDetails('none', event.nativeEvent);

        groupOnChange?.(nextChecked, details);
        onCheckedChange(nextChecked, details);

        if (details.isCanceled) {
          return;
        }

        clearErrors(name);
        setDirty(nextChecked !== validityData.initialValue);
        setCheckedState(nextChecked);

        if (!groupContext) {
          setFilled(nextChecked);

          if (validationMode === 'onChange') {
            fieldControlValidation.commitValidation(nextChecked);
          } else {
            fieldControlValidation.commitValidation(nextChecked, true);
          }
        }

        if (value && groupValue && setGroupValue && !parent) {
          const nextGroupValue = nextChecked
            ? [...groupValue, value]
            : groupValue.filter((item) => item !== value);

          setGroupValue(nextGroupValue, details);
          setFilled(nextGroupValue.length > 0);

          if (validationMode === 'onChange') {
            fieldControlValidation.commitValidation(nextGroupValue);
          } else {
            fieldControlValidation.commitValidation(nextGroupValue, true);
          }
        }
      },
      onFocus() {
        controlRef.current?.focus();
      },
    },
    // React <19 sets an empty value if `undefined` is passed explicitly
    // To avoid this, we only set the value if it's defined
    valueProp !== undefined
      ? { value: (groupContext ? checked && valueProp : valueProp) || '' }
      : EMPTY,
    groupContext
      ? fieldControlValidation.getValidationProps
      : fieldControlValidation.getInputValidationProps,
  );

  const computedChecked = isGrouped ? Boolean(groupChecked) : checked;
  const computedIndeterminate = isGrouped ? groupIndeterminate || indeterminate : indeterminate;

  React.useEffect(() => {
    if (parentContext && value) {
      parentContext.disabledStatesRef.current.set(value, disabled);
    }
  }, [parentContext, disabled, value]);

  const state: CheckboxRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      checked: computedChecked,
      disabled,
      readOnly,
      required,
      indeterminate: computedIndeterminate,
    }),
    [fieldState, computedChecked, disabled, readOnly, required, computedIndeterminate],
  );

  const stateAttributesMapping = useStateAttributesMapping(state);

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, controlRef, forwardedRef, groupContext?.registerControlRef],
    props: [
      {
        id,
        role: 'checkbox',
        disabled,
        'aria-checked': groupIndeterminate ? 'mixed' : checked,
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
        'aria-labelledby': labelId,
        [PARENT_CHECKBOX as string]: parent ? '' : undefined,
        onFocus,
        onBlur,
        onClick,
      },
      fieldControlValidation.getValidationProps,
      elementProps,
      otherGroupProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });

  return (
    <CheckboxRootContext.Provider value={state}>
      {element}
      {!checked && !groupContext && componentProps.name && !parent && (
        <input type="hidden" name={componentProps.name} value="off" />
      )}
      <input {...inputProps} />
    </CheckboxRootContext.Provider>
  );
});

export namespace CheckboxRoot {
  export interface State extends FieldRoot.State {
    /**
     * Whether the checkbox is currently ticked.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to tick or untick the checkbox.
     */
    readOnly: boolean;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     */
    required: boolean;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     */
    indeterminate: boolean;
  }

  export interface Props
    extends NativeButtonProps,
      Omit<BaseUIComponentProps<'button', State>, 'onChange' | 'value'> {
    /**
     * The id of the input element.
     */
    id?: string;
    /**
     * Identifies the field when a form is submitted.
     * @default undefined
     */
    name?: string;
    /**
     * Whether the checkbox is currently ticked.
     *
     * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
     * @default undefined
     */
    checked?: boolean;
    /**
     * Whether the checkbox is initially ticked.
     *
     * To render a controlled checkbox, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Event handler called when the checkbox is ticked or unticked.
     */
    onCheckedChange?: (checked: boolean, eventDetails: ChangeEventDetails) => void;
    /**
     * Whether the user should be unable to tick or untick the checkbox.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     * @default false
     */
    indeterminate?: boolean;
    /**
     * A ref to access the hidden `<input>` element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Whether the checkbox controls a group of child checkboxes.
     *
     * Must be used in a [Checkbox Group](https://base-ui.com/react/components/checkbox-group).
     * @default false
     */
    parent?: boolean;
    /**
     * The value of the selected checkbox.
     */
    value?: string;
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason>;
}
