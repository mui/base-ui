'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { NOOP } from '../../utils/noop';
import { useStateAttributesMapping } from '../utils/useStateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldItemContext } from '../../field/item/FieldItemContext';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useAriaLabelledBy } from '../../labelable-provider/useAriaLabelledBy';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { CheckboxRootContext } from './CheckboxRootContext';
import {
  BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useValueChanged } from '../../utils/useValueChanged';

export const PARENT_CHECKBOX = 'data-parent';

/**
 * Represents the checkbox itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxRoot = React.forwardRef(function CheckboxRoot(
  componentProps: CheckboxRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    checked: checkedProp,
    className,
    defaultChecked = false,
    'aria-labelledby': ariaLabelledByProp,
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
    uncheckedValue,
    value: valueProp,
    nativeButton = false,
    ...elementProps
  } = componentProps;

  const { clearErrors } = useFormContext();
  const {
    disabled: rootDisabled,
    name: fieldName,
    setDirty,
    setFilled,
    setFocused,
    setTouched,
    state: fieldState,
    validationMode,
    validityData,
    shouldValidateOnChange,
    validation: localValidation,
  } = useFieldRootContext();
  const fieldItemContext = useFieldItemContext();
  const { labelId, controlId, registerControlId, getDescriptionProps } = useLabelableContext();

  const groupContext = useCheckboxGroupContext();
  const parentContext = groupContext?.parent;
  const isGroupedWithParent = parentContext && groupContext.allValues;

  const disabled =
    rootDisabled || fieldItemContext.disabled || groupContext?.disabled || disabledProp;
  const name = fieldName ?? nameProp;
  const value = valueProp ?? name;

  const id = useBaseUiId();

  const parentId = useBaseUiId();
  let inputId = controlId;
  if (isGroupedWithParent) {
    inputId = parent ? parentId : `${parentContext.id}-${value}`;
  } else if (idProp) {
    inputId = idProp;
  }

  let groupProps: Partial<Omit<CheckboxRoot.Props, 'className'>> = {};
  if (isGroupedWithParent) {
    if (parent) {
      groupProps = groupContext.parent.getParentProps();
    } else if (value) {
      groupProps = groupContext.parent.getChildProps(value);
    }
  }

  const onCheckedChange = useStableCallback(onCheckedChangeProp);

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
  const controlSourceRef = useRefWithInit(() => Symbol('checkbox-control'));
  const hasRegisteredRef = React.useRef(false);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const validation = groupContext?.validation ?? localValidation;

  const [checked, setCheckedState] = useControlled({
    controlled: value && groupValue && !parent ? groupValue.includes(value) : groupChecked,
    default:
      value && defaultGroupValue && !parent ? defaultGroupValue.includes(value) : defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  // can't use useLabelableId because of optional groupContext and/or parent
  useIsoLayoutEffect(() => {
    if (registerControlId === NOOP) {
      return undefined;
    }

    hasRegisteredRef.current = true;
    registerControlId(controlSourceRef.current, inputId);

    return undefined;
  }, [inputId, groupContext, registerControlId, parent, controlSourceRef]);

  React.useEffect(() => {
    const controlSource = controlSourceRef.current;

    return () => {
      if (!hasRegisteredRef.current || registerControlId === NOOP) {
        return;
      }

      hasRegisteredRef.current = false;
      registerControlId(controlSource, undefined);
    };
  }, [registerControlId, controlSourceRef]);

  useField({
    enabled: !groupContext,
    id,
    commit: validation.commit,
    value: checked,
    controlRef,
    name,
    getValue: () => checked,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useMergedRefs(inputRefProp, inputRef, validation.inputRef);
  const ariaLabelledBy = useAriaLabelledBy(
    ariaLabelledByProp,
    labelId,
    inputRef,
    !nativeButton,
    inputId ?? undefined,
  );

  useIsoLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = groupIndeterminate;
      if (checked) {
        setFilled(true);
      }
    }
  }, [checked, groupIndeterminate, setFilled]);

  useValueChanged(checked, () => {
    if (groupContext && !parent) {
      return;
    }

    clearErrors(name);
    setFilled(checked);
    setDirty(checked !== validityData.initialValue);

    if (shouldValidateOnChange()) {
      validation.commit(checked);
    } else {
      validation.commit(checked, true);
    }
  });

  const inputProps = mergeProps<'input'>(
    {
      checked,
      disabled,
      // parent checkboxes unset `name` to be excluded from form submission
      name: parent ? undefined : name,
      // Set `id` to stop Chrome warning about an unassociated input.
      // When using a native button, the `id` is applied to the button instead.
      id: nativeButton ? undefined : (inputId ?? undefined),
      required,
      ref: mergedInputRef,
      style: name ? visuallyHiddenInput : visuallyHidden,
      tabIndex: -1,
      type: 'checkbox',
      'aria-hidden': true,
      onChange(event) {
        // Workaround for https://github.com/facebook/react/issues/9023
        if (event.nativeEvent.defaultPrevented) {
          return;
        }

        const nextChecked = event.target.checked;
        const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

        groupOnChange?.(nextChecked, details);
        onCheckedChange(nextChecked, details);

        if (details.isCanceled) {
          return;
        }

        setCheckedState(nextChecked);

        if (value && groupValue && setGroupValue && !parent) {
          const nextGroupValue = nextChecked
            ? [...groupValue, value]
            : groupValue.filter((item) => item !== value);

          setGroupValue(nextGroupValue, details);
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
      : EMPTY_OBJECT,
    getDescriptionProps,
    groupContext ? validation.getValidationProps : validation.getInputValidationProps,
  );

  const computedChecked = isGroupedWithParent ? Boolean(groupChecked) : checked;
  const computedIndeterminate = isGroupedWithParent
    ? groupIndeterminate || indeterminate
    : indeterminate;

  React.useEffect(() => {
    if (!parentContext || !value) {
      return undefined;
    }

    const disabledStates = parentContext.disabledStatesRef.current;
    disabledStates.set(value, disabled);

    return () => {
      disabledStates.delete(value);
    };
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

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [buttonRef, controlRef, forwardedRef, groupContext?.registerControlRef],
    props: [
      {
        id: nativeButton ? (inputId ?? undefined) : id,
        role: 'checkbox',
        'aria-checked': groupIndeterminate ? 'mixed' : checked,
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
        'aria-labelledby': ariaLabelledBy,
        [PARENT_CHECKBOX as string]: parent ? '' : undefined,
        onFocus() {
          setFocused(true);
        },
        onBlur() {
          const inputEl = inputRef.current;
          if (!inputEl) {
            return;
          }

          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            validation.commit(groupContext ? groupValue : inputEl.checked);
          }
        },
        onClick(event: React.MouseEvent) {
          if (readOnly || disabled) {
            return;
          }

          event.preventDefault();

          inputRef.current?.dispatchEvent(
            new PointerEvent('click', {
              bubbles: true,
              shiftKey: event.shiftKey,
              ctrlKey: event.ctrlKey,
              altKey: event.altKey,
              metaKey: event.metaKey,
            }),
          );
        },
      },
      getDescriptionProps,
      validation.getValidationProps,
      elementProps,
      otherGroupProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });

  return (
    <CheckboxRootContext.Provider value={state}>
      {element}
      {!checked && !groupContext && name && !parent && uncheckedValue !== undefined && (
        <input type="hidden" name={name} value={uncheckedValue} />
      )}
      <input {...inputProps} />
    </CheckboxRootContext.Provider>
  );
});

export interface CheckboxRootState extends FieldRoot.State {
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

export interface CheckboxRootProps
  extends
    NonNativeButtonProps,
    Omit<BaseUIComponentProps<'span', CheckboxRoot.State>, 'onChange' | 'value'> {
  /**
   * The id of the input element.
   */
  id?: string | undefined;
  /**
   * Identifies the field when a form is submitted.
   * @default undefined
   */
  name?: string | undefined;
  /**
   * Whether the checkbox is currently ticked.
   *
   * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
   * @default undefined
   */
  checked?: boolean | undefined;
  /**
   * Whether the checkbox is initially ticked.
   *
   * To render a controlled checkbox, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when the checkbox is ticked or unticked.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: CheckboxRootChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the user should be unable to tick or untick the checkbox.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must tick the checkbox before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
   * @default false
   */
  indeterminate?: boolean | undefined;
  /**
   * A ref to access the hidden `<input>` element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * Whether the checkbox controls a group of child checkboxes.
   *
   * Must be used in a [Checkbox Group](https://base-ui.com/react/components/checkbox-group).
   * @default false
   */
  parent?: boolean | undefined;
  /**
   * The value submitted with the form when the checkbox is unchecked.
   * By default, unchecked checkboxes do not submit any value, matching native checkbox behavior.
   */
  uncheckedValue?: string | undefined;
  /**
   * The value of the selected checkbox.
   */
  value?: string | undefined;
}

export type CheckboxRootChangeEventReason = typeof REASONS.none;
export type CheckboxRootChangeEventDetails =
  BaseUIChangeEventDetails<CheckboxRoot.ChangeEventReason>;

export namespace CheckboxRoot {
  export type State = CheckboxRootState;
  export type Props = CheckboxRootProps;
  export type ChangeEventReason = CheckboxRootChangeEventReason;
  export type ChangeEventDetails = CheckboxRootChangeEventDetails;
}
