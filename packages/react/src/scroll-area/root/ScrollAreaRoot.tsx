'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ScrollAreaRootContext } from './ScrollAreaRootContext';
import { useScrollAreaRoot } from './useScrollAreaRoot';

const state = {};

/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaRoot = React.forwardRef(function ScrollAreaRoot(
  props: ScrollAreaRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const scrollAreaRoot = useScrollAreaRoot();

  const { rootId } = scrollAreaRoot;

  const { renderElement } = useComponentRenderer({
    propGetter: scrollAreaRoot.getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
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

namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}

export { ScrollAreaRoot };
