'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useListboxItemContext } from '../item/ListboxItemContext';

/**
 * A drag handle within a listbox item for initiating drag-and-drop reordering.
 * Renders a `<div>` element.
 *
 * When placed inside a `Listbox.Item` with `draggable` set, the drag operation
 * will be restricted to start only from this handle.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItemDragHandle = React.forwardRef(function ListboxItemDragHandle(
  componentProps: ListboxItemDragHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;
  const { dragHandleRef } = useListboxItemContext();

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, dragHandleRef],
    props: [
      {
        'aria-hidden': true,
        style: { cursor: 'grab' },
      },
      elementProps,
    ],
  });
});

export interface ListboxItemDragHandleState {}

export interface ListboxItemDragHandleProps
  extends BaseUIComponentProps<'div', ListboxItemDragHandleState> {}

export namespace ListboxItemDragHandle {
  export type State = ListboxItemDragHandleState;
  export type Props = ListboxItemDragHandleProps;
}
