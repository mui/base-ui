import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';

type Payload = { id: string };
type TargetPayload = { index: number };
type DragData = { offset: number };
type TargetDragData = { entered: boolean };

declare const RootBeforeMoveStart: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onBeforeMoveStart']>
>;
expectType<Draggable.Root.BeforeMoveStartValue<Payload, DragData>, (typeof RootBeforeMoveStart)[0]>(
  RootBeforeMoveStart[0],
);
expectType<Draggable.Root.BeforeMoveStartEventDetails, (typeof RootBeforeMoveStart)[1]>(
  RootBeforeMoveStart[1],
);
expectType<Draggable.Root.BeforeMoveStartEventReason, (typeof RootBeforeMoveStart)[1]['reason']>(
  RootBeforeMoveStart[1].reason,
);
expectType<Draggable.Input, (typeof RootBeforeMoveStart)[1]['input']>(RootBeforeMoveStart[1].input);
expectType<Draggable.Root.Record<Payload, DragData>, (typeof RootBeforeMoveStart)[0]['source']>(
  RootBeforeMoveStart[0].source,
);
// @ts-expect-error Targets aren't resolved before pickup.
void RootBeforeMoveStart[0].target;
// @ts-expect-error The pointer state moved to the event details.
void RootBeforeMoveStart[0].input;

declare const RootMoveStart: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onMoveStart']>
>;
expectType<Draggable.Root.MoveStartValue<Payload, DragData>, (typeof RootMoveStart)[0]>(
  RootMoveStart[0],
);
expectType<Draggable.Root.MoveStartEventDetails, (typeof RootMoveStart)[1]>(RootMoveStart[1]);
expectType<Draggable.Root.MoveStartEventReason, (typeof RootMoveStart)[1]['reason']>(
  RootMoveStart[1].reason,
);
expectType<Draggable.LocationHistory, (typeof RootMoveStart)[1]['location']>(
  RootMoveStart[1].location,
);

declare const RootMove: Parameters<NonNullable<Draggable.Root.Props<Payload, DragData>['onMove']>>;
expectType<Draggable.Root.MoveValue<Payload, DragData>, (typeof RootMove)[0]>(RootMove[0]);
expectType<Draggable.Root.MoveEventDetails, (typeof RootMove)[1]>(RootMove[1]);
expectType<Draggable.Root.MoveEventReason, (typeof RootMove)[1]['reason']>(RootMove[1].reason);
expectType<Draggable.LocationHistory, (typeof RootMove)[1]['location']>(RootMove[1].location);
// @ts-expect-error The location moved to the event details.
void RootMove[0].location;

declare const RootTargetChange: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onTargetChange']>
>;
expectType<Draggable.Root.TargetChangeValue<Payload, DragData>, (typeof RootTargetChange)[0]>(
  RootTargetChange[0],
);
expectType<Draggable.Root.TargetChangeEventDetails, (typeof RootTargetChange)[1]>(
  RootTargetChange[1],
);
expectType<Draggable.Root.TargetChangeEventReason, (typeof RootTargetChange)[1]['reason']>(
  RootTargetChange[1].reason,
);

declare const RootMoveEnd: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onMoveEnd']>
>;
expectType<Draggable.Root.MoveEndValue<Payload, DragData>, (typeof RootMoveEnd)[0]>(RootMoveEnd[0]);
expectType<Draggable.Root.MoveEndEventDetails, (typeof RootMoveEnd)[1]>(RootMoveEnd[1]);
expectType<Draggable.Root.MoveEndEventReason, (typeof RootMoveEnd)[1]['reason']>(
  RootMoveEnd[1].reason,
);
expectType<Draggable.Target.Record | null, (typeof RootMoveEnd)[0]['target']>(
  RootMoveEnd[0].target,
);
// @ts-expect-error `dropTarget` was replaced by `target`.
void RootMoveEnd[0].dropTarget;
// @ts-expect-error Cancellation is read from `eventDetails.canceled`, not from the value.
void RootMoveEnd[0].canceled;
expectType<boolean, (typeof RootMoveEnd)[1]['canceled']>(RootMoveEnd[1].canceled);

declare const TargetStart: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableStart']
  >
>;
expectType<
  Draggable.Target.StartValue<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetStart)[0]
>(TargetStart[0]);
expectType<Draggable.Target.StartEventDetails, (typeof TargetStart)[1]>(TargetStart[1]);
expectType<Draggable.Target.StartEventReason, (typeof TargetStart)[1]['reason']>(
  TargetStart[1].reason,
);
expectType<
  Draggable.Target.Record<TargetPayload, TargetDragData>,
  (typeof TargetStart)[0]['target']
>(TargetStart[0].target);

declare const TargetMove: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableMove']
  >
>;
expectType<
  Draggable.Target.MoveValue<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetMove)[0]
>(TargetMove[0]);
expectType<Draggable.Target.MoveEventDetails, (typeof TargetMove)[1]>(TargetMove[1]);
expectType<Draggable.Target.MoveEventReason, (typeof TargetMove)[1]['reason']>(
  TargetMove[1].reason,
);
expectType<Draggable.LocationHistory, (typeof TargetMove)[1]['location']>(TargetMove[1].location);

declare const TargetEnter: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableEnter']
  >
>;
expectType<
  Draggable.Target.EnterValue<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetEnter)[0]
>(TargetEnter[0]);
expectType<Draggable.Target.EnterEventDetails, (typeof TargetEnter)[1]>(TargetEnter[1]);
expectType<Draggable.Target.EnterEventReason, (typeof TargetEnter)[1]['reason']>(
  TargetEnter[1].reason,
);

declare const TargetLeave: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableLeave']
  >
>;
expectType<
  Draggable.Target.LeaveValue<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetLeave)[0]
>(TargetLeave[0]);
expectType<Draggable.Target.LeaveEventDetails, (typeof TargetLeave)[1]>(TargetLeave[1]);
expectType<Draggable.Target.LeaveEventReason, (typeof TargetLeave)[1]['reason']>(
  TargetLeave[1].reason,
);

declare const TargetDrop: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableDrop']
  >
>;
expectType<
  Draggable.Target.DropValue<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetDrop)[0]
>(TargetDrop[0]);
expectType<Draggable.Target.DropEventDetails, (typeof TargetDrop)[1]>(TargetDrop[1]);
expectType<Draggable.Target.DropEventReason, (typeof TargetDrop)[1]['reason']>(
  TargetDrop[1].reason,
);
// @ts-expect-error `dropTarget` was the same record as `target`.
void TargetDrop[0].dropTarget;

declare const CollisionProviderMoveStart: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onMoveStart']>
>;
expectType<
  Draggable.CollisionProvider.MoveStartValue<Payload, DragData>,
  (typeof CollisionProviderMoveStart)[0]
>(CollisionProviderMoveStart[0]);
expectType<
  Draggable.CollisionProvider.MoveStartEventDetails,
  (typeof CollisionProviderMoveStart)[1]
>(CollisionProviderMoveStart[1]);
expectType<
  Draggable.CollisionProvider.MoveStartEventReason,
  (typeof CollisionProviderMoveStart)[1]['reason']
>(CollisionProviderMoveStart[1].reason);

declare const CollisionProviderCollisionChange: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onCollisionChange']>
>;
expectType<
  Draggable.CollisionProvider.CollisionChangeValue<Payload, DragData>,
  (typeof CollisionProviderCollisionChange)[0]
>(CollisionProviderCollisionChange[0]);
expectType<
  Draggable.CollisionProvider.CollisionChangeEventDetails<Payload, DragData>,
  (typeof CollisionProviderCollisionChange)[1]
>(CollisionProviderCollisionChange[1]);
expectType<
  Draggable.CollisionProvider.CollisionChangeEventReason,
  (typeof CollisionProviderCollisionChange)[1]['reason']
>(CollisionProviderCollisionChange[1].reason);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderCollisionChange)[0]['target']
>(CollisionProviderCollisionChange[0].target);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderCollisionChange)[1]['previousTarget']
>(CollisionProviderCollisionChange[1].previousTarget);
// @ts-expect-error The `collision` wrapper was removed; read `target` instead.
void CollisionProviderCollisionChange[0].collision;

declare const CollisionProviderMoveEnd: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onMoveEnd']>
>;
expectType<
  Draggable.CollisionProvider.MoveEndValue<Payload, DragData>,
  (typeof CollisionProviderMoveEnd)[0]
>(CollisionProviderMoveEnd[0]);
expectType<
  Draggable.CollisionProvider.MoveEndEventDetails<Payload, DragData>,
  (typeof CollisionProviderMoveEnd)[1]
>(CollisionProviderMoveEnd[1]);
expectType<
  Draggable.CollisionProvider.MoveEndEventReason,
  (typeof CollisionProviderMoveEnd)[1]['reason']
>(CollisionProviderMoveEnd[1].reason);
expectType<
  Draggable.Target.Record<Payload, DragData> | null,
  (typeof CollisionProviderMoveEnd)[1]['previousTarget']
>(CollisionProviderMoveEnd[1].previousTarget);

declare const ViewportDragScroll: Parameters<
  NonNullable<Draggable.Viewport.Props<Payload, DragData>['onDragScroll']>
>;
expectType<Draggable.Viewport.DragScrollValue<Payload, DragData>, (typeof ViewportDragScroll)[0]>(
  ViewportDragScroll[0],
);
expectType<Draggable.Viewport.DragScrollEventDetails, (typeof ViewportDragScroll)[1]>(
  ViewportDragScroll[1],
);
expectType<Draggable.Viewport.DragScrollEventReason, (typeof ViewportDragScroll)[1]['reason']>(
  ViewportDragScroll[1].reason,
);
expectType<Draggable.Input, (typeof ViewportDragScroll)[1]['input']>(ViewportDragScroll[1].input);
expectType<HTMLElement, (typeof ViewportDragScroll)[1]['element']>(ViewportDragScroll[1].element);
// @ts-expect-error The pointer state moved to the event details.
void ViewportDragScroll[0].input;

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
