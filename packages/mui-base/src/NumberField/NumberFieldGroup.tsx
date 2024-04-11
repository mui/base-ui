import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldContext } from './NumberFieldContext';
import type { NumberFieldGroupProps } from './NumberField.types';
import { resolveClassName } from '../utils/resolveClassName';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

/**
 * Groups interactive `NumberField` components together.
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldGroup API](https://mui.com/base-ui/react-number-field/components-api/#number-field-group)
 */
const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(
  props: NumberFieldGroupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { getGroupProps, ownerState } = useNumberFieldContext('Group');

  const groupProps = getGroupProps({
    ref: forwardedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return render(groupProps, ownerState);
});

NumberFieldGroup.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
} as any;

export { NumberFieldGroup };
