'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useScrollAreaViewport } from './useScrollAreaViewport';
import { ScrollAreaViewportContext } from './ScrollAreaViewportContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaViewport = React.forwardRef(function ScrollAreaViewport(
  componentProps: ScrollAreaViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { viewportRef } = useScrollAreaRootContext();
  const { props, computeThumbPosition } = useScrollAreaViewport();

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, viewportRef],
    props: [props, elementProps],
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

export namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
