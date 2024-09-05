import * as React from 'react';
import PropTypes from 'prop-types';
import type { NumberFieldIncrementProps } from './NumberFieldIncrement.types';
import { useNumberFieldContext } from '../Root/NumberFieldContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

/**
 * The increment stepper button.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldIncrement API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldIncrement)
 */
const NumberFieldIncrement = React.forwardRef(function NumberFieldIncrement(
  props: NumberFieldIncrementProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { getIncrementButtonProps, ownerState } = useNumberFieldContext('Increment');

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const buttonProps = getIncrementButtonProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return evaluateRenderProp(render, buttonProps, ownerState);
});

NumberFieldIncrement.propTypes /* remove-proptypes */ = {
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
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldIncrement };
