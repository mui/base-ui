'use client';
import * as React from 'react';

export type ListboxDragAndDropEdge = 'top' | 'bottom' | 'left' | 'right';

export interface SetupItemParameters {
  index: number;
  itemValue: any;
  element: HTMLElement;
  dragHandle: HTMLElement;
  dragEnabled: boolean;
  dropTargetEnabled: boolean;
  groupId: string | undefined;
  setClosestEdge: React.Dispatch<React.SetStateAction<ListboxDragAndDropEdge | null>>;
}

export interface ListboxDragAndDropProviderOnItemsReorderEvent<Value = any> {
  items: Value[];
  referenceItem: Value;
  edge: 'before' | 'after';
  reason: 'drag' | 'keyboard';
}

export interface ListboxDragAndDropProviderContext {
  onItemsReorder: ((event: ListboxDragAndDropProviderOnItemsReorderEvent) => void) | undefined;
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
