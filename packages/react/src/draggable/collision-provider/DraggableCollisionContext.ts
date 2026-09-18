'use client';
import * as React from 'react';
import type { DragCleanupFn, DragKind } from '../../types/drag';

export interface CollisionParticipant {
  kind: Pick<DragKind, 'id'>;
  payload: unknown;
  disabled?: boolean | undefined;
}

export type CollisionPlacement = 'before' | 'after';

export interface DraggableCollisionContextValue {
  kind: Pick<DragKind, 'id'>;
  parent: DraggableCollisionContextValue | null;
  register: (
    element: HTMLElement,
    getParticipant: () => CollisionParticipant,
    sourceElement: HTMLElement,
    /** Receives the participant's current insertion side, or `null` when it is not the destination. */
    onCollision: (placement: CollisionPlacement | null) => void,
  ) => DragCleanupFn;
}

export const DraggableCollisionContext = React.createContext<DraggableCollisionContextValue | null>(
  null,
);
