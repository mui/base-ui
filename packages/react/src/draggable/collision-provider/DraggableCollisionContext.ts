'use client';
import * as React from 'react';
import type { DragCleanupFn } from '../../utils/drag-and-drop/types';
import type { DraggableKind } from '../DraggableProvider';
import type {
  DraggableTargetSnapSteps,
  DraggableTargetResolutionContext,
} from '../target/DraggableTarget';

export interface CollisionParticipant {
  kind: Pick<DraggableKind, 'id'>;
  payload: unknown;
  snap?:
    | DraggableTargetSnapSteps
    | ((context: DraggableTargetResolutionContext) => DraggableTargetSnapSteps | undefined)
    | undefined;
  disabled?: boolean | undefined;
}

export interface DraggableCollisionContextValue {
  kind: Pick<DraggableKind, 'id'>;
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
