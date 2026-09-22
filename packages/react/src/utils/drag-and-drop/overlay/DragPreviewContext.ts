'use client';
import * as React from 'react';

/** Identity of the React boundary that renders a source's custom preview. */
export type DragPreviewContext = symbol;

/** The nearest preview boundary, owned by the required `Draggable.Provider`. */
export const DragPreviewContext = React.createContext<DragPreviewContext | null>(null);

/** Read the nearest preview boundary, or `null` outside a provider. */
export function useDragPreviewContext(): DragPreviewContext | null {
  return React.useContext(DragPreviewContext);
}
