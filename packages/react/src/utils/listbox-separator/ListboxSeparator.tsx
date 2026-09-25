'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * A visual separator between items.
 * Renders a `<div>` element.
 *
 * @internal
 */
export const ListboxSeparator = React.forwardRef(function ListboxSeparator(
  componentProps: ListboxSeparator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, orientation = 'horizontal', style, ...elementProps } = componentProps;

  const state: ListboxSeparatorState = { orientation };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ role: 'presentation' }, elementProps],
  });
});

export interface ListboxSeparatorProps extends BaseUIComponentProps<'div', ListboxSeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}

export interface ListboxSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}

export namespace ListboxSeparator {
  export type Props = ListboxSeparatorProps;
  export type State = ListboxSeparatorState;
}
