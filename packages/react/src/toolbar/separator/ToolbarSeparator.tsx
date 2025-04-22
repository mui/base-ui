'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { Separator } from '../../separator';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarSeparator = React.forwardRef(function ToolbarSeparator(
  props: ToolbarSeparator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const context = useToolbarRootContext();

  const orientation = (
    {
      vertical: 'horizontal',
      horizontal: 'vertical',
    } as Record<Orientation, Orientation>
  )[context.orientation];

  return <Separator orientation={orientation} {...props} ref={forwardedRef} />;
});

namespace ToolbarSeparator {
  export interface Props extends BaseUIComponentProps<'div', Separator.State>, Separator.Props {}
}

export { ToolbarSeparator };
