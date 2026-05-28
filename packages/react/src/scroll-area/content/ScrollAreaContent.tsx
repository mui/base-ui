'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useScrollAreaViewportContext } from '../viewport/ScrollAreaViewportContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { scrollAreaStateAttributesMapping } from '../root/stateAttributes';
import type { ScrollAreaRootState } from '../root/ScrollAreaRoot';

/**
 * A container for the content of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaContent = React.forwardRef(function ScrollAreaContent(
  componentProps: ScrollAreaContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const { computeThumbPosition } = useScrollAreaViewportContext();
  const { hasMeasuredScrollbar, viewportState } = useScrollAreaRootContext();

  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const computeOnInitialResizeRef = React.useRef(hasMeasuredScrollbar);

  useIsoLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    let hasInitialized = false;
    const resizeObserver = new ResizeObserver(() => {
      if (!hasInitialized) {
        hasInitialized = true;

        // Skip the normal mount callback, but recompute if content mounted after
        // the viewport's initial measurement.
        if (!computeOnInitialResizeRef.current) {
          return;
        }
      }

      computeThumbPosition();
    });

    if (contentWrapperRef.current) {
      resizeObserver.observe(contentWrapperRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [computeThumbPosition]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, contentWrapperRef],
    state: viewportState,
    stateAttributesMapping: scrollAreaStateAttributesMapping,
    props: [
      {
        role: 'presentation',
        style: {
          minWidth: 'fit-content',
        },
      },
      elementProps,
    ],
  });

  return element;
});

export interface ScrollAreaContentState extends ScrollAreaRootState {}

export interface ScrollAreaContentProps extends BaseUIComponentProps<
  'div',
  ScrollAreaContentState
> {}

export namespace ScrollAreaContent {
  export type State = ScrollAreaContentState;
  export type Props = ScrollAreaContentProps;
}
