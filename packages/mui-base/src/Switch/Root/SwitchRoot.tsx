'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import refType from '@mui/utils/refType';
import { useSwitchRoot } from './useSwitchRoot';
import { SwitchRootContext } from './SwitchRootContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { useSwitchStyleHooks } from './useSwitchStyleHooks';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../../Field/Root/FieldRoot.types';

function defaultRender(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

/**
 * The foundation for building custom-styled switches.
 *
 * Demos:
 *
 * - [Switch](https://base-ui.netlify.app/components/react-switch/)
 *
 * API:
 *
 * - [SwitchRoot API](https://base-ui.netlify.app/components/react-switch/#api-reference-SwitchRoot)
 */
const SwitchRoot = React.forwardRef(function SwitchRoot(
  props: SwitchRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    checked: checkedProp,
    className: classNameProp,
    defaultChecked,
    inputRef,
    onCheckedChange,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render: renderProp,
    ...other
  } = props;
  const render = renderProp ?? defaultRender;

  const { getInputProps, getButtonProps, checked } = useSwitchRoot(props);

  const { ownerState: fieldOwnerState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const ownerState: SwitchRoot.OwnerState = React.useMemo(
    () => ({
      ...fieldOwnerState,
      checked,
      disabled,
      readOnly,
      required,
    }),
    [fieldOwnerState, checked, disabled, readOnly, required],
  );

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useSwitchStyleHooks(ownerState);
  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const buttonProps = {
    className,
    ref: mergedRef,
    ...styleHooks,
    ...other,
  };

  return (
    <SwitchRootContext.Provider value={ownerState}>
      {evaluateRenderProp(render, getButtonProps(buttonProps), ownerState)}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </SwitchRootContext.Provider>
  );
});

namespace SwitchRoot {
  export interface Props
    extends useSwitchRoot.Parameters,
      Omit<BaseUIComponentProps<'button', SwitchRoot.OwnerState>, 'onChange'> {}

  export interface OwnerState extends FieldRootOwnerState {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
  }
}

SwitchRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the switch is checked.
   */
  checked: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default checked state. Use when the component is not controlled.
   */
  defaultChecked: PropTypes.bool,
  /**
   * If `true`, the component is disabled and can't be interacted with.
   *
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The id of the switch element.
   */
  id: PropTypes.string,
  /**
   * Ref to the underlying input element.
   */
  inputRef: refType,
  /**
   * Name of the underlying input element.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the checked state is changed.
   *
   * @param {boolean} checked The new checked state.
   * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
   */
  onCheckedChange: PropTypes.func,
  /**
   * If `true`, the component is read-only.
   * Functionally, this is equivalent to being disabled, but the assistive technologies will announce this differently.
   *
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * If `true`, the switch must be checked for the browser validation to pass.
   *
   * @default false
   */
  required: PropTypes.bool,
} as any;

export { SwitchRoot };
