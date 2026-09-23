import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';

type Payload = { id: string };
type TargetPayload = { index: number };
type DragData = { offset: number };
type TargetDragData = { entered: boolean };

declare const RootBeforeMoveStart: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onBeforeMoveStart']>
>;
expectType<Draggable.Root.BeforeMoveStartEvent<Payload, DragData>, (typeof RootBeforeMoveStart)[0]>(
  RootBeforeMoveStart[0],
);
expectType<Draggable.Root.BeforeMoveStartEventDetails, (typeof RootBeforeMoveStart)[1]>(
  RootBeforeMoveStart[1],
);
expectType<Draggable.Root.BeforeMoveStartEventReason, (typeof RootBeforeMoveStart)[1]['reason']>(
  RootBeforeMoveStart[1].reason,
);

declare const RootMoveStart: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onMoveStart']>
>;
expectType<Draggable.Root.MoveStartEvent<Payload, DragData>, (typeof RootMoveStart)[0]>(
  RootMoveStart[0],
);
expectType<Draggable.Root.MoveStartEventDetails, (typeof RootMoveStart)[1]>(RootMoveStart[1]);
expectType<Draggable.Root.MoveStartEventReason, (typeof RootMoveStart)[1]['reason']>(
  RootMoveStart[1].reason,
);

declare const RootMove: Parameters<NonNullable<Draggable.Root.Props<Payload, DragData>['onMove']>>;
expectType<Draggable.Root.MoveEvent<Payload, DragData>, (typeof RootMove)[0]>(RootMove[0]);
expectType<Draggable.Root.MoveEventDetails, (typeof RootMove)[1]>(RootMove[1]);
expectType<Draggable.Root.MoveEventReason, (typeof RootMove)[1]['reason']>(RootMove[1].reason);

declare const RootTargetChange: Parameters<
  NonNullable<Draggable.Root.Props<Payload, DragData>['onTargetChange']>
>;
expectType<Draggable.Root.TargetChangeEvent<Payload, DragData>, (typeof RootTargetChange)[0]>(
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
expectType<Draggable.Root.MoveEndEvent<Payload, DragData>, (typeof RootMoveEnd)[0]>(RootMoveEnd[0]);
expectType<Draggable.Root.MoveEndEventDetails, (typeof RootMoveEnd)[1]>(RootMoveEnd[1]);
expectType<Draggable.Root.MoveEndEventReason, (typeof RootMoveEnd)[1]['reason']>(
  RootMoveEnd[1].reason,
);

declare const TargetStart: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableStart']
  >
>;
expectType<
  Draggable.Target.StartEvent<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetStart)[0]
>(TargetStart[0]);
expectType<Draggable.Target.StartEventDetails, (typeof TargetStart)[1]>(TargetStart[1]);
expectType<Draggable.Target.StartEventReason, (typeof TargetStart)[1]['reason']>(
  TargetStart[1].reason,
);

declare const TargetMove: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableMove']
  >
>;
expectType<
  Draggable.Target.MoveEvent<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetMove)[0]
>(TargetMove[0]);
expectType<Draggable.Target.MoveEventDetails, (typeof TargetMove)[1]>(TargetMove[1]);
expectType<Draggable.Target.MoveEventReason, (typeof TargetMove)[1]['reason']>(
  TargetMove[1].reason,
);

declare const TargetEnter: Parameters<
  NonNullable<
    Draggable.Target.Props<Payload, TargetPayload, DragData, TargetDragData>['onDraggableEnter']
  >
>;
expectType<
  Draggable.Target.EnterEvent<Payload, TargetPayload, DragData, TargetDragData>,
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
  Draggable.Target.LeaveEvent<Payload, TargetPayload, DragData, TargetDragData>,
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
  Draggable.Target.DropEvent<Payload, TargetPayload, DragData, TargetDragData>,
  (typeof TargetDrop)[0]
>(TargetDrop[0]);
expectType<Draggable.Target.DropEventDetails, (typeof TargetDrop)[1]>(TargetDrop[1]);
expectType<Draggable.Target.DropEventReason, (typeof TargetDrop)[1]['reason']>(
  TargetDrop[1].reason,
);

declare const CollisionProviderMoveStart: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onMoveStart']>
>;
expectType<
  Draggable.CollisionProvider.MoveStartEvent<Payload, DragData>,
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
  Draggable.CollisionProvider.CollisionChangeEvent<Payload, DragData>,
  (typeof CollisionProviderCollisionChange)[0]
>(CollisionProviderCollisionChange[0]);
expectType<
  Draggable.CollisionProvider.CollisionChangeEventDetails,
  (typeof CollisionProviderCollisionChange)[1]
>(CollisionProviderCollisionChange[1]);
expectType<
  Draggable.CollisionProvider.CollisionChangeEventReason,
  (typeof CollisionProviderCollisionChange)[1]['reason']
>(CollisionProviderCollisionChange[1].reason);

declare const CollisionProviderMoveEnd: Parameters<
  NonNullable<Draggable.CollisionProvider.Props<Payload, DragData>['onMoveEnd']>
>;
expectType<
  Draggable.CollisionProvider.MoveEndEvent<Payload, DragData>,
  (typeof CollisionProviderMoveEnd)[0]
>(CollisionProviderMoveEnd[0]);
expectType<Draggable.CollisionProvider.MoveEndEventDetails, (typeof CollisionProviderMoveEnd)[1]>(
  CollisionProviderMoveEnd[1],
);
expectType<
  Draggable.CollisionProvider.MoveEndEventReason,
  (typeof CollisionProviderMoveEnd)[1]['reason']
>(CollisionProviderMoveEnd[1].reason);

declare const ViewportDragScroll: Parameters<
  NonNullable<Draggable.Viewport.Props<Payload, DragData>['onDragScroll']>
>;
expectType<Draggable.Viewport.DragScrollEvent<Payload, DragData>, (typeof ViewportDragScroll)[0]>(
  ViewportDragScroll[0],
);
expectType<Draggable.Viewport.DragScrollEventDetails, (typeof ViewportDragScroll)[1]>(
  ViewportDragScroll[1],
);
expectType<Draggable.Viewport.DragScrollEventReason, (typeof ViewportDragScroll)[1]['reason']>(
  ViewportDragScroll[1].reason,
);

const preview = (event: Draggable.Preview.RenderEvent<Payload, DragData>) => {
  expectType<Payload, typeof event.source.payload>(event.source.payload);
  expectType<DragData | undefined, typeof event.source.dragData>(event.source.dragData);
  return null;
};
const previewProps: Draggable.Preview.Props<Payload, DragData> = {
  kind: Draggable.createKind<Payload, DragData>('preview'),
  children: preview,
};
void previewProps;
