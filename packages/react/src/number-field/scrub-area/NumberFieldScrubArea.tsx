'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { styleHookMapping } from '../utils/styleHooks';

/**
 * An interactive area where the user can click and drag to change the field value.
 * Renders a `<span>` element.
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
    customStyleHookMapping: styleHookMapping,
  });

  return renderElement();
});

namespace NumberFieldScrubArea {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Cursor movement direction in the scrub area.
     * @default 'horizontal'
     */
    direction?: 'horizontal' | 'vertical';
    /**
     * Determines how many pixels the cursor must move before the value changes.
     * A higher value will make scrubbing less sensitive.
     * @default 2
     */
    pixelSensitivity?: number;
    /**
     * If specified, determines the distance that the cursor may move from the center
     * of the scrub area before it will loop back around.
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Cursor movement direction in the scrub area.
   * @default 'horizontal'
   */
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Determines how many pixels the cursor must move before the value changes.
   * A higher value will make scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity: PropTypes.number,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * If specified, determines the distance that the cursor may move from the center
   * of the scrub area before it will loop back around.
   */
  teleportDistance: PropTypes.number,
} as any;

export { NumberFieldScrubArea };
