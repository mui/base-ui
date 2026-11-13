'use client';
import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { useValueChanged } from '../../internals/useValueChanged';
import type { DropTargetParameters } from '../../utils/drag-and-drop/dropTarget';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import type { DraggableKind } from '../DraggableProvider';
import { DraggableCollisionContext } from './DraggableCollisionContext';

/**
 * Registers a `Draggable.Root`'s element as a participant of the nearest collision
 * provider of its kind. Returns a stable ref callback for the source element.
 * @internal
 */
export function useCollisionParticipant<TPayload, TDragData>(
  parameters: UseCollisionParticipantParameters<TPayload, TDragData>,
): (element: HTMLElement | null) => void {
  const enclosingProvider = React.useContext(DraggableCollisionContext);
  // Join the nearest provider of this source's kind. Providers of other kinds in
  // between are skipped, as on a board whose columns contain cards.
  let provider = parameters.collision ? enclosingProvider : null;
  while (provider && provider.kind.id !== parameters.kind.id) {
    provider = provider.parent;
  }

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (enclosingProvider && !parameters.explicitKind && parameters.collision) {
        warn(
          'A Draggable.Root inside a Draggable.CollisionProvider has no explicit kind, ' +
            'so it is not a destination for other items. ' +
            'Pass the same kind as the provider to the root, or set collision={false} to opt out. ' +
            'See https://base-ui.com/react/utils/draggable#collisionprovider.',
        );
      }
    }, [enclosingProvider, parameters.explicitKind, parameters.collision]);
  }

  // The cast holds because only a provider of this source's kind receives it.
  const getSnap = useStableCallback(() => parameters.snap as DropTargetParameters['snap']);
  const elementRef = React.useRef<HTMLElement | null>(null);
  const registrationRef = useRegistrationRef<HTMLElement>((element) =>
    // `collisionElement` is read once, here. It's often an inline arrow, and
    // re-registering on every render would reset the hovered target mid-drag.
    provider
      ? provider.register(parameters.collisionElement?.(element) ?? element, element, getSnap)
      : NOOP,
  );
  // Re-registering on a provider change is safe mid-drag. The source registration stays,
  // and the provider skips the dragged item's own participant.
  useValueChanged(provider, () => registrationRef(elementRef.current));

  return useRefWithInit(() => (element: HTMLElement | null) => {
    elementRef.current = element;
    registrationRef(element);
  }).current;
}

export interface UseCollisionParticipantParameters<TPayload, TDragData> {
  /** The source's kind, which picks the provider to join. */
  kind: Pick<DraggableKind, 'id'>;
  /** Whether the root set `kind` instead of inheriting the default. */
  explicitKind: boolean;
  /** `false` joins no provider. */
  collision: boolean;
  collisionElement: ((element: HTMLElement) => HTMLElement) | undefined;
  snap: DropTargetParameters<TPayload, unknown, TDragData>['snap'];
}
