'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { Separator, type SeparatorState } from '../../separator';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import type { ToolbarRoot } from '../root/ToolbarRoot';
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarSeparator = React.forwardRef(function ToolbarSeparator(
  props: ToolbarSeparator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const context = useToolbarRootContext();

  const orientation = (
    {
      vertical: 'horizontal',
      horizontal: 'vertical',
    } as Record<ToolbarRoot.Orientation, ToolbarRoot.Orientation>
  )[context.orientation];

  return <Separator orientation={orientation} {...props} ref={forwardedRef} />;
});

export interface ToolbarSeparatorState {}

export interface ToolbarSeparatorProps
  extends BaseUIComponentProps<'div', SeparatorState>, Separator.Props {}

export namespace ToolbarSeparator {
  export type State = ToolbarSeparatorState;
  export type Props = ToolbarSeparatorProps;
}
