import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useForkRef } from '../utils/useForkRef';
import type { NumberFieldScrubAreaCursorProps } from './NumberField.types';
import { isWebKit } from '../utils/detectBrowser';
import { useScrubAreaContext } from './ScrubAreaContext';
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
 * - [NumberFieldScrubAreaCursor API](https://mui.com/base-ui/react-number-field/components-api/#number-field-scrub-area-cursor)
 */
const NumberFieldScrubAreaCursor = React.forwardRef(function NumberFieldScrubAreaCursor(
  props: NumberFieldScrubAreaCursorProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { isScrubbing, virtualCursorRef, ownerState, transform } = useScrubAreaContext();
  const mergedRef = useForkRef(forwardedRef, virtualCursorRef);

  if (!isScrubbing || isWebKit()) {
    return null;
  }

  const virtualCursorProps: React.ComponentPropsWithRef<'span'> = {
    ...otherProps,
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    style: {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 2147483647,
      top: 0,
      left: 0,
      ...otherProps.style,
      transform: `${transform} ${otherProps.style?.transform || ''}`,
    },
  };

  return ReactDOM.createPortal(render(virtualCursorProps, ownerState), document.body);
});

NumberFieldScrubAreaCursor.propTypes /* remove-proptypes */ = {
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
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { NumberFieldScrubAreaCursor };
