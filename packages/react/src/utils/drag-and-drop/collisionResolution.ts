import type {
  DraggableTargetRecord,
  DraggableTargetResolutionContext,
} from '../../draggable/target/DraggableTarget';

/** Internal registration hook: capture geometry before consumers can mutate the layout. */
export const resolveCollision = Symbol.for('base-ui.resolveCollision');

export interface CollisionResolutionRegistration<TPayload = unknown, TDragData = unknown> {
  [resolveCollision]?:
    | ((
        target: DraggableTargetRecord<TPayload, TDragData>,
        context: DraggableTargetResolutionContext & { isDrop: boolean },
      ) => void)
    | undefined;
}
