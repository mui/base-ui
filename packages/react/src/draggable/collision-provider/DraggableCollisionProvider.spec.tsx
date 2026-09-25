import * as React from 'react';
import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';

interface CardPayload {
  id: string;
  title: string;
}

const card = Draggable.createKind<CardPayload>('card');
const marker = Draggable.createKind('marker');

// The payload type flows from `kind` into every callback.
<Draggable.CollisionProvider
  kind={card}
  canCollide={({ source, target }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<CardPayload, typeof target>(target);
    return target.id === 'full' ? 'reject' : true;
  }}
  onMoveStart={({ source }, details) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    // @ts-expect-error nothing was reported before the start.
    void details.previousTarget;
  }}
  onCollisionChange={({ target }, details) => {
    if (target) {
      expectType<CardPayload, typeof target.payload>(target.payload);
      const point = target.getLocalPoint();
      expectType<number, typeof point.x>(point.x);
      const snapped = target.getSnappedLocalPoint({ anchor: 'source' });
      expectType<number, typeof snapped.y>(snapped.y);
    }
    expectType<Draggable.Target.Record<CardPayload> | null, typeof details.previousTarget>(
      details.previousTarget,
    );
    expectType<
      Draggable.DragStartReason | Draggable.DragMoveReason | Draggable.DragEndReason,
      typeof details.reason
    >(details.reason);
  }}
  onMoveEnd={({ target }, details) => {
    expectType<Draggable.DragEndReason, typeof details.reason>(details.reason);
    expectType<Draggable.Target.Record<CardPayload> | null, typeof details.previousTarget>(
      details.previousTarget,
    );
    if (target) {
      expectType<CardPayload, typeof target.payload>(target.payload);
    }
  }}
/>;

<Draggable.Root
  kind={card}
  payload={{ id: 'a', title: 'A' }}
  snap={({ source, input, element }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<number, typeof input.clientX>(input.clientX);
    expectType<Element, typeof element>(element);
    return { x: 4, y: 8 };
  }}
/>;

// A kind without a payload types the callbacks with `undefined`.
<Draggable.CollisionProvider
  kind={marker}
  onCollisionChange={({ target }) => {
    if (target) {
      expectType<undefined, typeof target.payload>(target.payload);
    }
  }}
/>;

const invalidSnap = ({ source }: { source: { payload: string } }) => ({ x: source.payload.length });
const snapProps: Draggable.Root.Props<CardPayload> = {
  kind: card,
  payload: { id: 'a', title: 'A' },
  // @ts-expect-error snap must accept the kind's payload.
  snap: invalidSnap,
};
void snapProps;

// @ts-expect-error placement is computed by the application.
<Draggable.CollisionProvider kind={card} placement="edges" />;

// Exported aliases mirror the other parts.
declare const startValue: Draggable.CollisionProvider.MoveStartValue<CardPayload>;
expectType<CardPayload, typeof startValue.source.payload>(startValue.source.payload);
declare const changeValue: Draggable.CollisionProvider.CollisionChangeValue<CardPayload>;
expectType<Draggable.Target.Record<CardPayload> | null, typeof changeValue.target>(
  changeValue.target,
);
declare const changeDetails: Draggable.CollisionProvider.CollisionChangeEventDetails<CardPayload>;
expectType<Draggable.Target.Record<CardPayload> | null, typeof changeDetails.previousTarget>(
  changeDetails.previousTarget,
);
declare const endValue: Draggable.CollisionProvider.MoveEndValue<CardPayload>;
expectType<Draggable.Target.Record<CardPayload> | null, typeof endValue.target>(endValue.target);
declare const endDetails: Draggable.CollisionProvider.MoveEndEventDetails<CardPayload>;
expectType<Draggable.DragEndReason, typeof endDetails.reason>(endDetails.reason);
declare const props: Draggable.CollisionProvider.Props<CardPayload>;
void props.kind;

const dataKind = Draggable.createKind<{ id: string }, { offset: number }>('collision-data');
<Draggable.CollisionProvider
  kind={dataKind}
  onMoveStart={({ source }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
  }}
/>;
