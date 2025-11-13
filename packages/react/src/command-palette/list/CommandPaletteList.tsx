'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * A container for the list of command items.
 * Renders a `<ul>` element.
 */
export const CommandPaletteList = React.forwardRef(function CommandPaletteList(
  componentProps: CommandPaletteList.Props,
  forwardedRef: React.ForwardedRef<HTMLUListElement>,
) {
  const { className, render, id: idProp, ...elementProps } = componentProps;

  const { store } = useCommandPaletteRootContext(true);
  const filteredItems = store.useState('filteredItems');
  const filteredItemsLength = filteredItems.length;
  const listRef = store.context.listRef;

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    if (listRef.current) {
      store.set('listElement', listRef.current);
    }
  }, [store, listRef]);

  const state = React.useMemo<CommandPaletteList.State>(
    () => ({
      empty: filteredItemsLength === 0,
    }),
    [filteredItemsLength],
  );

  return useRenderElement('ul', componentProps, {
    state,
    ref: [listRef, forwardedRef],
    props: [
      {
        id,
        role: 'listbox',
        'aria-label': 'Commands',
      },
      elementProps,
    ],
  });
});

export interface CommandPaletteListState {
  /**
   * Whether the list is empty.
   */
  empty: boolean;
}

export interface CommandPaletteListProps
  extends BaseUIComponentProps<'ul', CommandPaletteList.State> {}

export namespace CommandPaletteList {
  export type Props = CommandPaletteListProps;
  export type State = CommandPaletteListState;
}
