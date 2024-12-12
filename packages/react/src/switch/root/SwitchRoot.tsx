'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSwitchRoot } from './useSwitchRoot';
import { SwitchRootContext } from './SwitchRootContext';
import { styleHookMapping } from '../styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { refType } from '../../utils/proptypes';

/**
 * Represents the switch itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
const SwitchRoot = React.forwardRef(function SwitchRoot(
  props: SwitchRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    checked: checkedProp,
    className,
    defaultChecked,
    inputRef,
    onCheckedChange,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render,
    ...other
  } = props;

  const { getInputProps, getButtonProps, checked } = useSwitchRoot(props);

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const state: SwitchRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      checked,
      disabled,
      readOnly,
      required,
    }),
    [fieldState, checked, disabled, readOnly, required],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'button',
    className,
    propGetter: getButtonProps,
    state,
    extraProps: other,
    customStyleHookMapping: styleHookMapping,
    ref: forwardedRef,
  });

  return (
    <SwitchRootContext.Provider value={state}>
      {renderElement()}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </SwitchRootContext.Provider>
  );
});

namespace SwitchRoot {
  export interface Props
    extends useSwitchRoot.Parameters,
      Omit<BaseUIComponentProps<'button', SwitchRoot.State>, 'onChange'> {}

  export interface State extends FieldRoot.State {
    /**
     * Whether the switch is currently active.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to activate or deactivate the switch.
     */
    readOnly: boolean;
    /**
     * Whether the user must activate the switch before submitting a form.
     */
    required: boolean;
  }
}

SwitchRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether the switch is currently active.
   *
   * To render an uncontrolled switch, use the `defaultChecked` prop instead.
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
   * Whether the switch is initially active.
   *
   * To render a controlled switch, use the `checked` prop instead.
   * @default false
   */
  defaultChecked: PropTypes.bool,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * A React ref to access the hidden `<input>` element.
   */
  inputRef: refType,
  /**
   * Identifies the field when a form is submitted.
   */
  name: PropTypes.string,
  /**
   * Event handler called when the switch is activated or deactivated.
   *
   * @param {boolean} checked The new checked state.
   * @param {Event} event The corresponding event that initiated the change.
   */
  onCheckedChange: PropTypes.func,
  /**
   * Whether the user should be unable to activate or deactivate the switch.
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
   * Whether the user must activate the switch before submitting a form.
   * @default false
   */
  required: PropTypes.bool,
} as any;

export { SwitchRoot };
