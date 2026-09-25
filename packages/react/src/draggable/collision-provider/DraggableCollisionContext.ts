'use client';
import * as React from 'react';
import type {
  DragCleanupFn,
  DragKind,
  DragSnapSteps,
  DraggableTargetResolutionContext,
} from '../../types/drag';

export interface CollisionParticipant {
  kind: Pick<DragKind, 'id'>;
  payload: unknown;
  snap?:
    | DragSnapSteps
    | ((context: DraggableTargetResolutionContext) => DragSnapSteps | undefined)
    | undefined;
  disabled?: boolean | undefined;
}

export interface DraggableCollisionContextValue {
  kind: Pick<DragKind, 'id'>;
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
