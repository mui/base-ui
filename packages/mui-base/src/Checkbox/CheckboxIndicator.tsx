import * as React from 'react';
import PropTypes from 'prop-types';
import type { CheckboxIndicatorProps } from './Checkbox.types';
import { CheckboxContext } from './CheckboxContext';
import { resolveClassName } from '../utils/resolveClassName';
import { useCheckboxStyleHooks } from './utils';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

/**
 * The indicator part of the Checkbox.
 *
 * Demos:
 *
 * - [Checkbox](https://mui.com/base-ui/react-checkbox/)
 *
 * API:
 *
 * - [CheckboxIndicator API](https://mui.com/base-ui/react-checkbox/components-api/#checkbox-indicator)
 */
const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  props: CheckboxIndicatorProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render: renderProp, className, keepMounted = false, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const ownerState = React.useContext(CheckboxContext);
  if (ownerState === null) {
    throw new Error('Base UI: Checkbox.Indicator is not placed inside the Checkbox component.');
  }

  const styleHooks = useCheckboxStyleHooks(ownerState);

  if (!keepMounted && !ownerState.checked && !ownerState.indeterminate) {
    return null;
  }

  const elementProps = {
    className: resolveClassName(className, ownerState),
    ref: forwardedRef,
    ...styleHooks,
    ...otherProps,
  };

  return render(elementProps, ownerState);
});

CheckboxIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
} as any;

export { CheckboxIndicator };
