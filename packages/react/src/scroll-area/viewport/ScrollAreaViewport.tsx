'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useScrollAreaViewport } from './useScrollAreaViewport';
import { ScrollAreaViewportContext } from './ScrollAreaViewportContext';

const state = {};

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaViewport = React.forwardRef(function ScrollAreaViewport(
  props: ScrollAreaViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { viewportRef } = useScrollAreaRootContext();
  const { getViewportProps, computeThumbPosition } = useScrollAreaViewport();

  const mergedRef = useForkRef(forwardedRef, viewportRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getViewportProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: otherProps,
  });

  const contextValue: ScrollAreaViewportContext = React.useMemo(
    () => ({
      computeThumbPosition,
    }),
    [computeThumbPosition],
  );

  return (
    <ScrollAreaViewportContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaViewportContext.Provider>
  );
});

namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}

export { ScrollAreaViewport };
