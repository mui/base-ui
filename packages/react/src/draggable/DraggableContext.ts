'use client';

import * as React from 'react';
import type { DraggableKind } from './DraggableProvider';

/**
 * Created once per `Draggable.Provider`. Its identity also marks the provider's
 * preview boundary. The engine publishes custom preview content with the value
 * seen from the source, and only that provider's overlay renders it.
 */
export interface DraggableContextValue {
  defaultKind: DraggableKind<undefined, unknown>;
}

export const DraggableContext = React.createContext<DraggableContextValue | null>(null);

export function useDraggableContext(): DraggableContextValue {
  const context = React.useContext(DraggableContext);
  if (context === null) {
    throw new Error(
      'Base UI: Draggable.Provider is missing, so the drag kind and preview boundary cannot be resolved. ' +
        'Place <Draggable.Provider> above every <Draggable.Root>, <Draggable.Target>, <Draggable.Viewport>, ' +
        'and <Draggable.CollisionProvider>, and above any component calling useManager. ' +
        'See https://base-ui.com/react/utils/draggable.',
    );
  }
  return context;
}
