'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';
import type { FieldRoot } from '../../field/root/FieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { type UseCheckboxRoot, useCheckboxRoot } from './useCheckboxRoot';
import { CheckboxRootContext } from './CheckboxRootContext';

/**
 * Represents the checkbox itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
const CheckboxRoot = React.forwardRef(function CheckboxRoot(
  props: CheckboxRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    name,
    onCheckedChange,
    defaultChecked,
    parent = false,
    readOnly = false,
    indeterminate = false,
    required = false,
    disabled: disabledProp = false,
    checked: checkedProp,
    render,
    className,
    inputRef,
    ...otherProps
  } = props;

  const groupContext = useCheckboxGroupContext();
  const parentContext = groupContext?.parent;
  const isGrouped = parentContext && groupContext.allValues;

  let groupProps: Partial<Omit<CheckboxRoot.Props, 'className'>> = {};
  if (isGrouped) {
    if (parent) {
      groupProps = groupContext.parent.getParentProps();
    } else if (name) {
      groupProps = groupContext.parent.getChildProps(name);
    }
  }

  const {
    checked: groupChecked = checkedProp,
    indeterminate: groupIndeterminate = indeterminate,
    onCheckedChange: groupOnChange = onCheckedChange,
    ...otherGroupProps
  } = groupProps;

  const { checked, getInputProps, getButtonProps } = useCheckboxRoot({
    ...props,
    inputRef,
    checked: groupChecked,
    indeterminate: groupIndeterminate,
    onCheckedChange: groupOnChange,
  });

  const computedChecked = isGrouped ? Boolean(groupChecked) : checked;
  const computedIndeterminate = isGrouped ? groupIndeterminate : indeterminate;

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  React.useEffect(() => {
    if (parentContext && name) {
      parentContext.disabledStatesRef.current.set(name, disabled);
    }
  }, [parentContext, disabled, name]);

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

  const customStyleHookMapping = useCustomStyleHookMapping(state);

  const { renderElement } = useComponentRenderer({
    propGetter: getButtonProps,
    render: render ?? 'button',
    ref: forwardedRef,
    state,
    className,
    customStyleHookMapping,
    extraProps: {
      ...otherProps,
      ...otherGroupProps,
    },
  });

  return (
    <CheckboxRootContext.Provider value={state}>
      {renderElement()}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </CheckboxRootContext.Provider>
  );
});

namespace CheckboxRoot {
  export interface State extends FieldRoot.State {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
    indeterminate: boolean;
  }
  export interface Props
    extends UseCheckboxRoot.Parameters,
      Omit<BaseUIComponentProps<'button', State>, 'onChange'> {}
}

CheckboxRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the component is checked.
   *
   * @default undefined
   */
  checked: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default checked state. Use when the component is not controlled.
   *
   * @default false
   */
  defaultChecked: PropTypes.bool,
  /**
   * Whether the component should ignore user actions.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the checkbox will be indeterminate.
   *
   * @default false
   */
  indeterminate: PropTypes.bool,
  /**
   * The ref to the input element.
   */
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.object,
    }),
  ]),
  /**
   * Name of the underlying input element.
   *
   * @default undefined
   */
  name: PropTypes.string,
  /**
   * Callback fired when the checked state is changed.
   *
   * @param {boolean} checked The new checked state.
   * @param {Event} event The event source of the callback.
   */
  onCheckedChange: PropTypes.func,
  /**
   * If `true`, the checkbox is a parent checkbox for a group of child checkboxes.
   * @default false
   */
  parent: PropTypes.bool,
  /**
   * If `true`, the component is read only.
   *
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * If `true`, the `input` element is required.
   *
   * @default false
   */
  required: PropTypes.bool,
} as any;

export { CheckboxRoot };
