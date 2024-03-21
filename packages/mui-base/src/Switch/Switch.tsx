'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import refType from '@mui/utils/refType';
import { useSwitch } from '../useSwitch';
import { SwitchProps, SwitchOwnerState } from './Switch.types';
import { resolveClassName } from '../utils/resolveClassName';
import { SwitchContext } from './SwitchContext';
import { useSwitchStyleHooks } from './useSwitchStyleHooks';

function defaultRender(props: React.ComponentPropsWithRef<'button'>) {
  // eslint-disable-next-line react/button-has-type
  return <button {...props} />;
}

/**
 * The foundation for building custom-styled switches.
 *
 * Demos:
 *
 * - [Switch](https://mui.com/base-ui/react-switch/)
 *
 * API:
 *
 * - [Switch API](https://mui.com/base-ui/react-switch/components-api/#switch)
 */
const Switch = React.forwardRef(function Switch(
  props: SwitchProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    checked: checkedProp,
    className: classNameProp,
    defaultChecked,
    disabled = false,
    inputRef,
    onChange,
    readOnly = false,
    required = false,
    render = defaultRender,
    ...other
  } = props;

  const { getInputProps, getButtonProps, checked } = useSwitch(props);

  const ownerState: SwitchOwnerState = React.useMemo(
    () => ({
      checked,
      disabled,
      readOnly,
      required,
    }),
    [checked, disabled, readOnly, required],
  );

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useSwitchStyleHooks(ownerState);

  const buttonProps = {
    className,
    ref: forwardedRef,
    ...styleHooks,
    ...other,
  };

  return (
    <SwitchContext.Provider value={ownerState}>
      {render(getButtonProps(buttonProps), ownerState)}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </SwitchContext.Provider>
  );
});

Switch.propTypes /* remove-proptypes */ = {
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
   * Ref to the underlying input element.
   */
  inputRef: refType,
  /**
   * Name of the underlying input element.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the state is changed.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value` (string).
   * You can pull out the new checked state by accessing `event.target.checked` (boolean).
   */
  onChange: PropTypes.func,
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
  render: PropTypes.func,
  /**
   * If `true`, the switch must be checked for the browser validation to pass.
   *
   * @default false
   */
  required: PropTypes.bool,
} as any;

export { Switch };
