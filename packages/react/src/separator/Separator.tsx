'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';

export type SeparatorOrientation = BaseOrientation;

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

export interface SeparatorProps extends BaseUIComponentProps<'div', Separator.State> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Separator.Orientation;
}

export interface SeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Separator.Orientation;
}

export namespace Separator {
  export type Props = SeparatorProps;
  export type State = SeparatorState;
  export type Orientation = SeparatorOrientation;
}
