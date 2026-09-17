import type { DropTargetRecord, DropTargetResolutionContext } from '../../types/drag';

/** Internal registration hook: capture geometry before consumers can mutate the layout. */
export const resolveCollision = Symbol.for('base-ui.resolveCollision');

export interface CollisionResolutionRegistration {
  [resolveCollision]?:
    ((target: DropTargetRecord, context: DropTargetResolutionContext) => void) | undefined;
}
