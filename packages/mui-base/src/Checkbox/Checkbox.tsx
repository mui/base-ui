import * as React from 'react';
import PropTypes from 'prop-types';
import type { CheckboxOwnerState, CheckboxProps } from './Checkbox.types';
import { resolveClassName } from '../utils/resolveClassName';
import { CheckboxContext } from './CheckboxContext';
import { useCheckbox } from '../useCheckbox';
import { useCheckboxStyleHooks } from './utils';

function defaultRender(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

/**
 * The foundation for building custom-styled checkboxes.
 *
 * Demos:
 *
 * - [Checkbox](https://mui.com/base-ui/react-checkbox/)
 *
 * API:
 *
 * - [Checkbox API](https://mui.com/base-ui/react-checkbox/components-api/#checkbox)
 */
const Checkbox = React.forwardRef(function Checkbox(
  props: CheckboxProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    name,
    onChange,
    defaultChecked,
    disabled = false,
    readOnly = false,
    indeterminate = false,
    required = false,
    checked: checkedProp,
    render: renderProp,
    className,
    ...domProps
  } = props;
  const render = renderProp ?? defaultRender;

  const { checked, getInputProps, getButtonProps } = useCheckbox(props);

  const ownerState: CheckboxOwnerState = React.useMemo(
    () => ({
      checked,
      disabled,
      readOnly,
      required,
      indeterminate,
    }),
    [checked, disabled, readOnly, required, indeterminate],
  );

  const styleHooks = useCheckboxStyleHooks(ownerState);

  const buttonProps = {
    className: resolveClassName(className, ownerState),
    ref: forwardedRef,
    ...styleHooks,
    ...domProps,
  };

  return (
    <CheckboxContext.Provider value={ownerState}>
      {render(getButtonProps(buttonProps), ownerState)}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </CheckboxContext.Provider>
  );
});

Checkbox.propTypes /* remove-proptypes */ = {
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default checked state. Use when the component is not controlled.
   *
   * @default false
   */
  defaultChecked: PropTypes.bool,
  /**
   * If `true`, the component is disabled.
   *
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
   * Name of the underlying input element.
   *
   * @default undefined
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
   * If `true`, the component is read only.
   *
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
  /**
   * If `true`, the `input` element is required.
   *
   * @default false
   */
  required: PropTypes.bool,
} as any;

export { Checkbox };
