'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';

/**
 * The scrub area element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldScrubArea = React.forwardRef(function NumberFieldScrubArea(
  props: NumberFieldScrubArea.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    render,
    className,
    direction = 'horizontal',
    pixelSensitivity = 2,
    teleportDistance,
    ...otherProps
  } = props;

  const { getScrubAreaProps, scrubAreaRef, scrubHandleRef, state } = useNumberFieldRootContext();

  React.useImperativeHandle(scrubHandleRef, () => ({
    direction,
    pixelSensitivity,
    teleportDistance,
  }));

  const mergedRef = useForkRef(scrubAreaRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getScrubAreaProps,
    ref: mergedRef,
    render: render ?? 'span',
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldScrubArea {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * The direction that the scrub area should change the value.
     * @default 'horizontal'
     */
    direction?: 'horizontal' | 'vertical';
    /**
     * Determines the number of pixels the cursor must move before the value changes. A higher value
     * will make the scrubbing less sensitive.
     * @default 2
     */
    pixelSensitivity?: number;
    /**
     * If specified, how much the cursor can move around the center of the scrub area element before
     * it will loop back around.
     */
    teleportDistance?: number | undefined;
  }
}

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
   * @default 'horizontal'
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
