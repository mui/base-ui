'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { isWebKit } from '../../utils/detectBrowser';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { ownerDocument } from '../../utils/owner';
import { mergeProps } from '../../merge-props';
import { styleHookMapping } from '../utils/styleHooks';

/**
 * A custom element to display instead of the native cursor while using the scrub area.
 * Renders a `<span>` element.
 *
 * This component uses the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API), which may prompt the browser to display a related notification. It is disabled
 * in Safari to avoid a layout shift that this notification causes there.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldScrubAreaCursor = React.forwardRef(function NumberFieldScrubAreaCursor(
  props: NumberFieldScrubAreaCursor.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { isScrubbing, isTouchInput, isPointerLockDenied, scrubAreaCursorRef, state } =
    useNumberFieldRootContext();

  const [element, setElement] = React.useState<Element | null>(null);

  const mergedRef = useForkRef(forwardedRef, scrubAreaCursorRef, setElement);

  const propGetter = React.useCallback(
    (externalProps: GenericHTMLProps) =>
      mergeProps<'span'>(
        {
          role: 'presentation',
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          },
        },
        externalProps,
      ),
    [],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    ref: mergedRef,
    render: render ?? 'span',
    state,
    className,
    extraProps: otherProps,
    customStyleHookMapping: styleHookMapping,
  });

  if (!isScrubbing || isWebKit() || isTouchInput || isPointerLockDenied) {
    return null;
  }

  return ReactDOM.createPortal(renderElement(), ownerDocument(element).body);
});

namespace NumberFieldScrubAreaCursor {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'span', State> {}
}

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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldScrubAreaCursor };
