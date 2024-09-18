'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { NumberFieldGroupProps } from './NumberFieldGroup.types';
import { useNumberFieldContext } from '../Root/NumberFieldContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

/**
 * Groups interactive `NumberField` components together.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldGroup API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldGroup)
 */
const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(
  props: NumberFieldGroupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { getGroupProps, ownerState } = useNumberFieldContext('Group');

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const groupProps = getGroupProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return evaluateRenderProp(render, groupProps, ownerState);
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
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldGroup };
