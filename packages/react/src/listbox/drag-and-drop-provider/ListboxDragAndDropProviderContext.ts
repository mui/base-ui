'use client';
import * as React from 'react';

export type ListboxDragAndDropEdge = 'top' | 'bottom' | 'left' | 'right';
export type ListboxDragAndDropTargetEdge = 'before' | 'after';

export interface ListboxDragAndDropItem<Value = any> {
  value: Value;
  index: number;
  groupId: string | undefined;
  disabled: boolean;
}

export interface SetupItemParameters {
  index: number;
  itemValue: any;
  element: HTMLElement;
  dragHandle: HTMLElement;
  dragEnabled: boolean;
  dropTargetEnabled: boolean;
  groupId: string | undefined;
  disabled: boolean;
  setClosestEdge: React.Dispatch<React.SetStateAction<ListboxDragAndDropEdge | null>>;
}

export interface ListboxDragAndDropProviderOnItemsReorderEvent<Value = any> {
  items: Value[];
  referenceItem: Value;
  edge: ListboxDragAndDropTargetEdge;
  reason: 'drag' | 'keyboard';
}

export interface ListboxDragAndDropProviderContext {
  onItemsReorder: ((event: ListboxDragAndDropProviderOnItemsReorderEvent) => void) | undefined;
  canDragItem: (item: ListboxDragAndDropItem) => boolean;
  canDropItems: (
    sourceItems: ListboxDragAndDropItem[],
    targetItem: ListboxDragAndDropItem,
    edge: ListboxDragAndDropTargetEdge,
  ) => boolean;
  policySignature: readonly [unknown, unknown];
  setupItem: (params: SetupItemParameters) => (() => void) | undefined;
}

export const ListboxDragAndDropProviderContext = React.createContext<
  ListboxDragAndDropProviderContext | undefined
>(undefined);

export function useListboxDragAndDropProviderContext(
  optional?: false,
): ListboxDragAndDropProviderContext;
export function useListboxDragAndDropProviderContext(
  optional: true,
): ListboxDragAndDropProviderContext | undefined;
export function useListboxDragAndDropProviderContext(optional?: boolean) {
  const context = React.useContext(ListboxDragAndDropProviderContext);

  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ListboxDragAndDropProviderContext is missing. Use <Listbox.DragAndDropProvider>.',
    );
  }

  return context;
}
