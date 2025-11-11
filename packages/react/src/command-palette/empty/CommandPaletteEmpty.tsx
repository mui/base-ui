'use client';
import * as React from 'react';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A component that displays when there are no matching items.
 * Renders a `<div>` element.
 */
export const CommandPaletteEmpty = React.forwardRef(function CommandPaletteEmpty(
  componentProps: CommandPaletteEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useCommandPaletteRootContext(true);
  const filteredItems = store.useState('filteredItems');
  const filteredItemsLength = filteredItems.length;
  const query = store.useState('query');

  const shouldShow = filteredItemsLength === 0 && query.trim().length > 0;

  if (!shouldShow) {
    return null;
  }

  const state = React.useMemo<CommandPaletteEmpty.State>(
    () => ({
      empty: true,
    }),
    [],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'status',
        'aria-live': 'polite',
      },
      elementProps,
    ],
  });
});

export interface CommandPaletteEmptyState {
  /**
   * Whether the list is empty.
   */
  empty: boolean;
}

export interface CommandPaletteEmptyProps
  extends BaseUIComponentProps<'div', CommandPaletteEmpty.State> {}

export namespace CommandPaletteEmpty {
  export type Props = CommandPaletteEmptyProps;
  export type State = CommandPaletteEmptyState;
}
