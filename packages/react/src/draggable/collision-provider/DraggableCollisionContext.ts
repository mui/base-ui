'use client';
import * as React from 'react';
import type { DragCleanupFn, DragKind } from '../../types/drag';

export interface CollisionParticipant {
  kind: DragKind<unknown>;
  payload: unknown;
  disabled?: boolean | undefined;
}

export interface DraggableCollisionContextValue {
  kind: DragKind<unknown>;
  parent: DraggableCollisionContextValue | null;
  register: (
    element: HTMLElement,
    getParticipant: () => CollisionParticipant,
    sourceElement: HTMLElement,
  ) => DragCleanupFn;
}

export const DraggableCollisionContext = React.createContext<DraggableCollisionContextValue | null>(
  null,
);
