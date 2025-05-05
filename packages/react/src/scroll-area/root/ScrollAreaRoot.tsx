'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { ScrollAreaRootContext } from './ScrollAreaRootContext';
import { useScrollAreaRoot } from './useScrollAreaRoot';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaRoot = React.forwardRef(function ScrollAreaRoot(
  componentProps: ScrollAreaRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const scrollAreaRoot = useScrollAreaRoot();

  const { rootId } = scrollAreaRoot;

  const renderElement = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [scrollAreaRoot.props, elementProps],
  });

  const contextValue = React.useMemo(() => scrollAreaRoot, [scrollAreaRoot]);

  const viewportId = `[data-id="${rootId}-viewport"]`;

  const html = React.useMemo(
    () => ({
      __html: `${viewportId}{scrollbar-width:none}${viewportId}::-webkit-scrollbar{display:none}`,
    }),
    [viewportId],
  );

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {rootId && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={html}
        />
      )}
      {renderElement()}
    </ScrollAreaRootContext.Provider>
  );
});

export namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
