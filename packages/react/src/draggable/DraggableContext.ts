'use client';

import * as React from 'react';
import type { DragKind } from '../types/drag';

export interface DraggableContextValue {
  defaultKind: DragKind<undefined>;
}

export const DraggableContext = React.createContext<DraggableContextValue | null>(null);

export function useDraggableContext(): DraggableContextValue {
  const context = React.useContext(DraggableContext);
  if (context === null) {
    throw new Error(
      'Base UI: Draggable.Provider is missing, so the drag kind and preview boundary cannot be resolved. ' +
        'Place <Draggable.Provider> above the draggable and drop target parts. ' +
        'See https://base-ui.com/react/utils/draggable.',
    );
  }
  return context;
}
