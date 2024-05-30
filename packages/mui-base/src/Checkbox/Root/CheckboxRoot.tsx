import * as React from 'react';
import PropTypes from 'prop-types';
import { CheckboxContext } from './CheckboxContext';
import { useCheckboxRoot } from './useCheckboxRoot';
import type { CheckboxOwnerState, CheckboxRootProps } from './CheckboxRoot.types';
import { useCheckboxStyleHooks } from '../utils';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';

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
const CheckboxRoot = React.forwardRef(function CheckboxRoot(
  props: CheckboxRootProps,
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
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRenderFunctions.button;

  const { checked, getInputProps, getButtonProps } = useCheckboxRoot(props);

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
  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const buttonProps = getButtonProps({
    className: resolveClassName(className, ownerState),
    ref: mergedRef,
    ...styleHooks,
    ...otherProps,
  });

  return (
    <CheckboxContext.Provider value={ownerState}>
      {evaluateRenderProp(render, buttonProps, ownerState)}
      {!checked && props.name && <input type="hidden" name={props.name} value="off" />}
      <input {...getInputProps()} />
    </CheckboxContext.Provider>
  );
});

CheckboxRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the checkbox is focused on mount.
   *
   * @default false
   */
  autoFocus: PropTypes.bool,
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
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * If `true`, the `input` element is required.
   *
   * @default false
   */
  required: PropTypes.bool,
} as any;

export { CheckboxRoot };
