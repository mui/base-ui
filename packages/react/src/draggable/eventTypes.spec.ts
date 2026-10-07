import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';

type Payload = { id: string };
type TargetPayload = { index: number };
type DragData = { offset: number };
type TargetDragData = { entered: boolean };

declare const RootBeforeMoveStart: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onBeforeMoveStart']>
>[0];
expectType<
  Draggable.Root.BeforeMoveStartEventDetails<Payload, DragData>,
  typeof RootBeforeMoveStart
>(RootBeforeMoveStart);
expectType<Draggable.Root.BeforeMoveStartEventReason, (typeof RootBeforeMoveStart)['reason']>(
  RootBeforeMoveStart.reason,
);
expectType<Draggable.Input, (typeof RootBeforeMoveStart)['input']>(RootBeforeMoveStart.input);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof RootBeforeMoveStart)['source']>(
  RootBeforeMoveStart.source,
);
expectType<boolean, (typeof RootBeforeMoveStart)['isCanceled']>(RootBeforeMoveStart.isCanceled);
// @ts-expect-error Targets aren't resolved before pickup.
void RootBeforeMoveStart.target;

declare const RootMoveStart: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onMoveStart']>
>[0];
expectType<Draggable.Root.MoveStartEventDetails<Payload, DragData>, typeof RootMoveStart>(
  RootMoveStart,
);
expectType<Draggable.Root.MoveStartEventReason, (typeof RootMoveStart)['reason']>(
  RootMoveStart.reason,
);
expectType<Draggable.LocationHistory, (typeof RootMoveStart)['location']>(RootMoveStart.location);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof RootMoveStart)['source']>(
  RootMoveStart.source,
);
expectType<Draggable.Target.Record | null, (typeof RootMoveStart)['target']>(RootMoveStart.target);

declare const RootMove: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onMove']>
>[0];
expectType<Draggable.Root.MoveEventDetails<Payload, DragData>, typeof RootMove>(RootMove);
expectType<Draggable.Root.MoveEventReason, (typeof RootMove)['reason']>(RootMove.reason);
expectType<Draggable.LocationHistory, (typeof RootMove)['location']>(RootMove.location);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof RootMove)['source']>(RootMove.source);
expectType<Draggable.Target.Record | null, (typeof RootMove)['target']>(RootMove.target);

declare const RootTargetChange: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onTargetChange']>
>[0];
expectType<Draggable.Root.TargetChangeEventDetails<Payload, DragData>, typeof RootTargetChange>(
  RootTargetChange,
);
expectType<Draggable.Root.TargetChangeEventReason, (typeof RootTargetChange)['reason']>(
  RootTargetChange.reason,
);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof RootTargetChange)['source']>(
  RootTargetChange.source,
);
expectType<Draggable.Target.Record | null, (typeof RootTargetChange)['target']>(
  RootTargetChange.target,
);

declare const RootMoveEnd: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onMoveEnd']>
>[0];
expectType<Draggable.Root.MoveEndEventDetails<Payload, DragData>, typeof RootMoveEnd>(RootMoveEnd);
expectType<Draggable.Root.MoveEndEventReason, (typeof RootMoveEnd)['reason']>(RootMoveEnd.reason);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof RootMoveEnd)['source']>(
  RootMoveEnd.source,
);
expectType<Draggable.Target.Record | null, (typeof RootMoveEnd)['target']>(RootMoveEnd.target);
expectType<boolean, (typeof RootMoveEnd)['canceled']>(RootMoveEnd.canceled);
// @ts-expect-error `canceled` is only on `onMoveEnd`. A move reads `reason`.
void RootMove.canceled;
// @ts-expect-error `currentTarget` is only on a drop target's handlers.
void RootMove.currentTarget;

declare const TargetStart: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableStart']
  >
>[0];
expectType<
  Draggable.Target.StartEventDetails<Payload, TargetPayload, DragData, TargetDragData>,
  typeof TargetStart
>(TargetStart);
expectType<Draggable.Target.StartEventReason, (typeof TargetStart)['reason']>(TargetStart.reason);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof TargetStart)['source']>(
  TargetStart.source,
);
// `target` is the innermost target under the pointer, this target or one nested inside it.
expectType<Draggable.Target.Record, (typeof TargetStart)['target']>(TargetStart.target);
expectType<
  Draggable.Target.Record<TargetPayload, TargetDragData>,
  (typeof TargetStart)['currentTarget']
>(TargetStart.currentTarget);

declare const TargetMove: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableMove']
  >
>[0];
expectType<
  Draggable.Target.MoveEventDetails<Payload, TargetPayload, DragData, TargetDragData>,
  typeof TargetMove
>(TargetMove);
expectType<Draggable.Target.MoveEventReason, (typeof TargetMove)['reason']>(TargetMove.reason);
expectType<Draggable.LocationHistory, (typeof TargetMove)['location']>(TargetMove.location);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof TargetMove)['source']>(
  TargetMove.source,
);
expectType<Draggable.Target.Record, (typeof TargetMove)['target']>(TargetMove.target);
expectType<
  Draggable.Target.Record<TargetPayload, TargetDragData>,
  (typeof TargetMove)['currentTarget']
>(TargetMove.currentTarget);

declare const TargetEnter: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableEnter']
  >
>[0];
expectType<
  Draggable.Target.EnterEventDetails<Payload, TargetPayload, DragData, TargetDragData>,
  typeof TargetEnter
>(TargetEnter);
expectType<Draggable.Target.EnterEventReason, (typeof TargetEnter)['reason']>(TargetEnter.reason);
expectType<Draggable.Target.Record, (typeof TargetEnter)['target']>(TargetEnter.target);
expectType<
  Draggable.Target.Record<TargetPayload, TargetDragData>,
  (typeof TargetEnter)['currentTarget']
>(TargetEnter.currentTarget);

declare const TargetLeave: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableLeave']
  >
>[0];
expectType<
  Draggable.Target.LeaveEventDetails<Payload, TargetPayload, DragData, TargetDragData>,
  typeof TargetLeave
>(TargetLeave);
expectType<Draggable.Target.LeaveEventReason, (typeof TargetLeave)['reason']>(TargetLeave.reason);
// Once the drag has left this target, no target may remain under the pointer.
expectType<Draggable.Target.Record | null, (typeof TargetLeave)['target']>(TargetLeave.target);
expectType<
  Draggable.Target.Record<TargetPayload, TargetDragData>,
  (typeof TargetLeave)['currentTarget']
>(TargetLeave.currentTarget);
// @ts-expect-error `canceled` is only on `onMoveEnd`. A leave reads `reason`.
void TargetLeave.canceled;

declare const TargetDrop: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableDrop']
  >
>[0];
expectType<
  Draggable.Target.DropEventDetails<Payload, TargetPayload, DragData, TargetDragData>,
  typeof TargetDrop
>(TargetDrop);
expectType<Draggable.Target.DropEventReason, (typeof TargetDrop)['reason']>(TargetDrop.reason);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof TargetDrop)['source']>(
  TargetDrop.source,
);
expectType<Draggable.Target.Record, (typeof TargetDrop)['target']>(TargetDrop.target);
expectType<
  Draggable.Target.Record<TargetPayload, TargetDragData>,
  (typeof TargetDrop)['currentTarget']
>(TargetDrop.currentTarget);

declare const CollisionProviderMoveStart: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onMoveStart']>
>[0];
expectType<
  Draggable.CollisionProvider.MoveStartEventDetails<Payload, DragData>,
  typeof CollisionProviderMoveStart
>(CollisionProviderMoveStart);
expectType<
  Draggable.CollisionProvider.MoveStartEventReason,
  (typeof CollisionProviderMoveStart)['reason']
>(CollisionProviderMoveStart.reason);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof CollisionProviderMoveStart)['source']>(
  CollisionProviderMoveStart.source,
);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderMoveStart)['target']
>(CollisionProviderMoveStart.target);

declare const CollisionProviderCollisionChange: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onCollisionChange']>
>[0];
expectType<
  Draggable.CollisionProvider.CollisionChangeEventDetails<Payload, DragData>,
  typeof CollisionProviderCollisionChange
>(CollisionProviderCollisionChange);
expectType<
  Draggable.CollisionProvider.CollisionChangeEventReason,
  (typeof CollisionProviderCollisionChange)['reason']
>(CollisionProviderCollisionChange.reason);
expectType<
  Draggable.Root.Record<Payload, DragData>,
  (typeof CollisionProviderCollisionChange)['source']
>(CollisionProviderCollisionChange.source);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderCollisionChange)['target']
>(CollisionProviderCollisionChange.target);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderCollisionChange)['previousTarget']
>(CollisionProviderCollisionChange.previousTarget);

declare const CollisionProviderMoveEnd: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onMoveEnd']>
>[0];
expectType<
  Draggable.CollisionProvider.MoveEndEventDetails<Payload, DragData>,
  typeof CollisionProviderMoveEnd
>(CollisionProviderMoveEnd);
expectType<
  Draggable.CollisionProvider.MoveEndEventReason,
  (typeof CollisionProviderMoveEnd)['reason']
>(CollisionProviderMoveEnd.reason);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderMoveEnd)['target']
>(CollisionProviderMoveEnd.target);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderMoveEnd)['previousTarget']
>(CollisionProviderMoveEnd.previousTarget);
expectType<boolean, (typeof CollisionProviderMoveEnd)['canceled']>(
  CollisionProviderMoveEnd.canceled,
);
// @ts-expect-error `canceled` is only on `onMoveEnd`.
void CollisionProviderCollisionChange.canceled;

declare const ViewportDragScroll: Parameters<
  NonNullable<Draggable.Viewport.Props<Payload, DragData>['onDragScroll']>
>[0];
expectType<Draggable.Viewport.DragScrollEventDetails<Payload, DragData>, typeof ViewportDragScroll>(
  ViewportDragScroll,
);
expectType<Draggable.Viewport.DragScrollEventReason, (typeof ViewportDragScroll)['reason']>(
  ViewportDragScroll.reason,
);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof ViewportDragScroll)['source']>(
  ViewportDragScroll.source,
);
expectType<number, (typeof ViewportDragScroll)['x']>(ViewportDragScroll.x);
expectType<number, (typeof ViewportDragScroll)['y']>(ViewportDragScroll.y);
expectType<Draggable.Viewport.DragScrollDirection, (typeof ViewportDragScroll)['direction']>(
  ViewportDragScroll.direction,
);
expectType<Draggable.Input, (typeof ViewportDragScroll)['input']>(ViewportDragScroll.input);
expectType<HTMLElement, (typeof ViewportDragScroll)['element']>(ViewportDragScroll.element);

const preview = (parameters: Draggable.Preview.RenderParameters<Payload, DragData>) => {
  expectType<Payload, typeof parameters.source.payload>(parameters.source.payload);
  expectType<DragData | undefined, typeof parameters.source.dragData>(parameters.source.dragData);
  expectType<Draggable.LocationHistory, typeof parameters.location>(parameters.location);
  return null;
};
const previewProps: Draggable.Preview.Props<Payload, DragData> = {
  kind: Draggable.createKind<Payload, DragData>('preview'),
  children: preview,
};
void previewProps;

declare const source: Draggable.Root.Record<Payload, DragData>;
declare const target: Draggable.Target.Record<TargetPayload, TargetDragData>;
// @ts-expect-error Payload writes must use updatePayload.
source.payload = { id: 'changed' };
// @ts-expect-error Drag data writes must use updateDragData.
source.dragData = { offset: 1 };
// @ts-expect-error Payload writes must use updatePayload.
target.payload = { index: 1 };
// @ts-expect-error Drag data writes must use updateDragData.
target.dragData = { entered: true };
source.updatePayload({ id: 'changed' });
source.updateDragData({ offset: 1 });
target.updatePayload({ index: 1 });
target.updateDragData({ entered: true });
