'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { isWebKit } from '../../utils/detectBrowser';
import type { BaseUIComponentProps } from '../../utils/types';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { ownerDocument } from '../../utils/owner';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useNumberFieldScrubAreaContext } from '../scrub-area/NumberFieldScrubAreaContext';
import { useRenderElementLazy } from '../../utils/useRenderElement';

/**
 * A custom element to display instead of the native cursor while using the scrub area.
 * Renders a `<span>` element.
 *
 * This component uses the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API), which may prompt the browser to display a related notification. It is disabled
 * in Safari to avoid a layout shift that this notification causes there.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldScrubAreaCursor = React.forwardRef(function NumberFieldScrubAreaCursor(
  componentProps: NumberFieldScrubAreaCursor.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { state } = useNumberFieldRootContext();
  const { isScrubbing, isTouchInput, isPointerLockDenied, scrubAreaCursorRef } =
    useNumberFieldScrubAreaContext();

  const [element, setElement] = React.useState<Element | null>(null);

  const renderElement = useRenderElementLazy('span', componentProps, {
    ref: [forwardedRef, scrubAreaCursorRef, setElement],
    state,
    props: [
      {
        role: 'presentation',
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  if (!isScrubbing || isWebKit || isTouchInput || isPointerLockDenied) {
    return null;
  }

  return ReactDOM.createPortal(renderElement(), ownerDocument(element).body);
});

export namespace NumberFieldScrubAreaCursor {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
