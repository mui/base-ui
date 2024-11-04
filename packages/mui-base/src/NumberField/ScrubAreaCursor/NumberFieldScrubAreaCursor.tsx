'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../Root/NumberFieldRootContext';
import { isWebKit } from '../../utils/detectBrowser';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import type { NumberFieldRoot } from '../Root/NumberFieldRoot';
import { ownerDocument } from '../../utils/owner';

/**
 * The scrub area cursor element.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldScrubAreaCursor API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldScrubAreaCursor)
 */
const NumberFieldScrubAreaCursor = React.forwardRef(function NumberFieldScrubAreaCursor(
  props: NumberFieldScrubAreaCursor.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { isScrubbing, scrubAreaCursorRef, ownerState, getScrubAreaCursorProps } =
    useNumberFieldRootContext();

  const [element, setElement] = React.useState<Element | null>(null);

  const mergedRef = useForkRef(forwardedRef, scrubAreaCursorRef, setElement);

  const { renderElement } = useComponentRenderer({
    propGetter: getScrubAreaCursorProps,
    ref: mergedRef,
    render: render ?? 'span',
    ownerState,
    className,
    extraProps: otherProps,
  });

  if (!isScrubbing || isWebKit()) {
    return null;
  }

  return ReactDOM.createPortal(renderElement(), ownerDocument(element).body);
});

namespace NumberFieldScrubAreaCursor {
  export interface OwnerState extends NumberFieldRoot.OwnerState {}
  export type Props = BaseUIComponentProps<'span', OwnerState> & {}
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldScrubAreaCursor };
