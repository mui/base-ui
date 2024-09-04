'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import type { NumberFieldScrubAreaProps } from './NumberFieldScrubArea.types';
import { useNumberFieldContext } from '../Root/NumberFieldContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

/**
 *
 * The scrub area element.
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldScrubArea API](https://mui.com/base-ui/react-number-field/components-api/#number-field-scrub-area)
 */
const NumberFieldScrubArea = React.forwardRef(function NumberFieldScrubArea(
  props: NumberFieldScrubAreaProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    direction = 'vertical',
    pixelSensitivity = 2,
    teleportDistance,
    render: renderProp,
    className,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRender;

  const { getScrubAreaProps, scrubAreaRef, scrubHandleRef, ownerState } =
    useNumberFieldContext('ScrubArea');

  React.useImperativeHandle(scrubHandleRef, () => ({
    direction,
    pixelSensitivity,
    teleportDistance,
  }));

  const mergedRef = useRenderPropForkRef(render, scrubAreaRef, forwardedRef);

  const scrubAreaProps = getScrubAreaProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return evaluateRenderProp(render, scrubAreaProps, ownerState);
});

NumberFieldScrubArea.propTypes /* remove-proptypes */ = {
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
   * The direction that the scrub area should change the value.
   * @default 'vertical'
   */
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Determines the number of pixels the cursor must move before the value changes. A higher value
   * will make the scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity: PropTypes.number,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * If specified, how much the cursor can move around the center of the scrub area element before
   * it will loop back around.
   */
  teleportDistance: PropTypes.number,
} as any;

export { NumberFieldScrubArea };
