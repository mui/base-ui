import * as React from 'react';
import PropTypes from 'prop-types';
import { CheckboxContext } from './CheckboxContext';
import { useCheckboxRoot } from './useCheckboxRoot';
import type { CheckboxRootOwnerState, CheckboxRootProps } from './CheckboxRoot.types';
import { useCheckboxStyleHooks } from '../utils';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';

/**
 * The foundation for building custom-styled checkboxes.
 *
 * Demos:
 *
 * - [Checkbox](https://base-ui.netlify.app/components/react-checkbox/)
 *
 * API:
 *
 * - [CheckboxRoot API](https://base-ui.netlify.app/components/react-checkbox/#api-reference-CheckboxRoot)
 */
const CheckboxRoot = React.forwardRef(function CheckboxRoot(
  props: CheckboxRootProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    name,
    onCheckedChange,
    defaultChecked,
    readOnly = false,
    indeterminate = false,
    required = false,
    disabled: disabledProp = false,
    checked: checkedProp,
    render: renderProp,
    className,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRenderFunctions.button;

  const { checked, getInputProps, getButtonProps } = useCheckboxRoot(props);

  const { ownerState: fieldOwnerState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const ownerState: CheckboxRootOwnerState = React.useMemo(
    () => ({
      ...fieldOwnerState,
      checked,
      disabled,
      readOnly,
      required,
      indeterminate,
    }),
    [checked, disabled, readOnly, required, indeterminate, fieldOwnerState],
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
   * The id of the input element.
   */
  id: PropTypes.string,
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
   * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
   */
  onCheckedChange: PropTypes.func,
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
