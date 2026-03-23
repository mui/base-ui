'use client';
import * as React from 'react';

export interface ListboxGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * A stable identifier for the group, used to constrain drag-and-drop
   * when `draggable="within-group"` is set on items.
   */
  groupId: string;
}

export const ListboxGroupContext = React.createContext<ListboxGroupContext | undefined>(undefined);

export function useListboxGroupContext(optional?: false): ListboxGroupContext;
export function useListboxGroupContext(optional: true): ListboxGroupContext | undefined;
export function useListboxGroupContext(optional?: boolean) {
  const context = React.useContext(ListboxGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ListboxGroupContext is missing. ListboxGroup parts must be placed within <Listbox.Group>.',
    );
  }
  return context;
}
