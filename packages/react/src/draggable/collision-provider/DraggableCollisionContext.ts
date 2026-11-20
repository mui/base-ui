'use client';
import * as React from 'react';
import type { DragCleanupFn } from '../../utils/drag-and-drop/types';
import type { DropTargetParameters } from '../../utils/drag-and-drop/dropTarget';
import type { DraggableKind } from '../DraggableProvider';

export interface DraggableCollisionContextValue {
  kind: Pick<DraggableKind, 'id'>;
  parent: DraggableCollisionContextValue | null;
  /**
   * Registers the participant of the source registered on `sourceElement`, measured
   * on `element`. Its payload is read from the source's registration.
   */
  register: (
    element: HTMLElement,
    sourceElement: HTMLElement,
    getSnap: () => DropTargetParameters['snap'],
  ) => DragCleanupFn;
}

export const DraggableCollisionContext = React.createContext<DraggableCollisionContextValue | null>(
  null,
);
