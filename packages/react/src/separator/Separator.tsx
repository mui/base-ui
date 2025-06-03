'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
export const Separator = React.forwardRef(function SeparatorComponent(
  componentProps: Separator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, orientation = 'horizontal', ...elementProps } = componentProps;

  const state: Separator.State = React.useMemo(() => ({ orientation }), [orientation]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ role: 'separator', 'aria-orientation': orientation }, elementProps],
  });

  return element;
});

export namespace Separator {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: Orientation;
  }

  export interface State {
    /**
     * The orientation of the separator.
     */
    orientation: Orientation;
  }
}
