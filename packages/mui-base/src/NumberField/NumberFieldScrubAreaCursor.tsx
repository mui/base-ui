import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import type { ScrubAreaCursorProps } from './NumberField.types';
import { isWebKit } from '../utils/detectBrowser';
import { resolveClassName } from '../utils/resolveClassName';
import { useNumberFieldContext } from './NumberFieldContext';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

/**
 *
 * The scrub area cursor element.
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
  props: ScrubAreaCursorProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { isScrubbing, scrubAreaCursorRef, ownerState, getScrubAreaCursorProps } =
    useNumberFieldContext('ScrubAreaCursor');

  const mergedRef = useRenderPropForkRef(render, forwardedRef, scrubAreaCursorRef);

  if (!isScrubbing || isWebKit()) {
    return null;
  }

  const virtualCursorProps = getScrubAreaCursorProps({
    ...otherProps,
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
  });

  return ReactDOM.createPortal(
    evaluateRenderProp(render, virtualCursorProps, ownerState),
    document.body,
  );
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
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldScrubAreaCursor };
