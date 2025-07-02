'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useModernLayoutEffect } from '../../utils';
import { useScrollAreaViewportContext } from '../viewport/ScrollAreaViewportContext';
import { useRenderElement } from '../../utils/useRenderElement';

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
  const { render, className, ...elementProps } = componentProps;

  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const { computeThumbPosition } = useScrollAreaViewportContext();

  useModernLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const ro = new ResizeObserver(computeThumbPosition);

    if (contentWrapperRef.current) {
      ro.observe(contentWrapperRef.current);
    }

    return () => {
      ro.disconnect();
    };
  }, [computeThumbPosition]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, contentWrapperRef],
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

export namespace ScrollAreaContent {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
