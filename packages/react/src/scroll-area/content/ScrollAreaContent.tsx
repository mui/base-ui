'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeProps } from '../../merge-props';
import { useModernLayoutEffect } from '../../utils';
import { useScrollAreaViewportContext } from '../viewport/ScrollAreaViewportContext';

const state = {};

/**
 * A container for the content of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaContent = React.forwardRef(function ScrollAreaContent(
  props: ScrollAreaContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ref: [forwardedRef, contentWrapperRef],
    state,
    extraProps: mergeProps<'div'>(otherProps, {
      role: 'presentation',
      style: {
        minWidth: 'fit-content',
      },
    }),
  });

  return renderElement();
});

namespace ScrollAreaContent {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { ScrollAreaContent };
