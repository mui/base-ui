'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isWebKit } from '@base-ui/utils/detectBrowser';
import { ownerDocument } from '@base-ui/utils/owner';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useNumberFieldScrubAreaContext } from '../scrub-area/NumberFieldScrubAreaContext';
import { useRenderElement } from '../../utils/useRenderElement';

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

  const [domElement, setDomElement] = React.useState<Element | null>(null);

  const shouldRender = isScrubbing && !isWebKit && !isTouchInput && !isPointerLockDenied;

  const element = useRenderElement('span', componentProps, {
    enabled: shouldRender,
    ref: [forwardedRef, scrubAreaCursorRef, setDomElement],
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

  return element && ReactDOM.createPortal(element, ownerDocument(domElement).body);
});

export interface NumberFieldScrubAreaCursorState extends NumberFieldRoot.State {}

export interface NumberFieldScrubAreaCursorProps extends BaseUIComponentProps<
  'span',
  NumberFieldScrubAreaCursor.State
> {}

export namespace NumberFieldScrubAreaCursor {
  export type State = NumberFieldScrubAreaCursorState;
  export type Props = NumberFieldScrubAreaCursorProps;
}
