import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../utils/useForkRef';
import { useNumberFieldContext } from './NumberFieldContext';
import type { NumberFieldScrubAreaProps } from './NumberField.types';
import { resolveClassName } from '../utils/resolveClassName';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

/**
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

  const { getScrubAreaProps, scrubAreaRef, scrubHandleRef, ownerState, isScrubbing } =
    useNumberFieldContext('ScrubArea');

  React.useImperativeHandle(scrubHandleRef, () => ({
    direction,
    pixelSensitivity,
    teleportDistance,
  }));

  const mergedRef = useForkRef(scrubAreaRef, forwardedRef);

  const scrubAreaProps = getScrubAreaProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ['data-scrubbing' as string]: isScrubbing || undefined,
    ...otherProps,
  });

  return render(scrubAreaProps, ownerState);
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
   *
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
  render: PropTypes.func,
  /**
   * If specified, how much the cursor can move from the scrubbing starting point before the cursor
   * teleports back to the starting point.
   */
  teleportDistance: PropTypes.number,
} as any;

export { NumberFieldScrubArea };
