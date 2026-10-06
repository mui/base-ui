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
  canCollide={({ source, input, element, payload }) => {
    expectType<CardPayload, typeof source.payload>(source.payload);
    expectType<number, typeof input.clientX>(input.clientX);
    expectType<Element, typeof element>(element);
    expectType<CardPayload, typeof payload>(payload);
    return payload.id === 'full' ? 'reject' : true;
  }}
  onMoveStart={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    expectType<Draggable.Target.Record<CardPayload> | null, typeof eventDetails.target>(
      eventDetails.target,
    );
    // @ts-expect-error nothing was reported before the start.
    void eventDetails.previousTarget;
  }}
  onCollisionChange={(eventDetails) => {
    expectType<CardPayload, typeof eventDetails.source.payload>(eventDetails.source.payload);
    if (eventDetails.target) {
      expectType<CardPayload, typeof eventDetails.target.payload>(eventDetails.target.payload);
      const point = eventDetails.target.getLocalPoint();
      expectType<number, typeof point.x>(point.x);
      const snapped = eventDetails.target.getSnappedLocalPoint({ anchor: 'source' });
      expectType<number, typeof snapped.y>(snapped.y);
    }
    expectType<Draggable.Target.Record<CardPayload> | null, typeof eventDetails.previousTarget>(
      eventDetails.previousTarget,
    );
    expectType<
      | Draggable.Root.MoveStartEventReason
      | Draggable.Root.MoveEventReason
      | Draggable.Root.MoveEndEventReason,
      typeof eventDetails.reason
    >(eventDetails.reason);
  }}
  onMoveEnd={(eventDetails) => {
    expectType<Draggable.Root.MoveEndEventReason, typeof eventDetails.reason>(eventDetails.reason);
    expectType<Draggable.Target.Record<CardPayload> | null, typeof eventDetails.previousTarget>(
      eventDetails.previousTarget,
    );
    expectType<boolean, typeof eventDetails.canceled>(eventDetails.canceled);
    if (eventDetails.target) {
      expectType<CardPayload, typeof eventDetails.target.payload>(eventDetails.target.payload);
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
  onCollisionChange={(eventDetails) => {
    if (eventDetails.target) {
      expectType<undefined, typeof eventDetails.target.payload>(eventDetails.target.payload);
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

// @ts-expect-error `anyKind` only fits `accept`, and a group's items share one kind.
<Draggable.CollisionProvider kind={Draggable.anyKind} />;

// Exported aliases mirror the other parts.
declare const startDetails: Draggable.CollisionProvider.MoveStartEventDetails<CardPayload>;
expectType<CardPayload, typeof startDetails.source.payload>(startDetails.source.payload);
declare const changeDetails: Draggable.CollisionProvider.CollisionChangeEventDetails<CardPayload>;
expectType<Draggable.Target.Record<CardPayload> | null, typeof changeDetails.target>(
  changeDetails.target,
);
expectType<Draggable.Target.Record<CardPayload> | null, typeof changeDetails.previousTarget>(
  changeDetails.previousTarget,
);
declare const endDetails: Draggable.CollisionProvider.MoveEndEventDetails<CardPayload>;
expectType<Draggable.Target.Record<CardPayload> | null, typeof endDetails.target>(
  endDetails.target,
);
expectType<Draggable.Root.MoveEndEventReason, typeof endDetails.reason>(endDetails.reason);
declare const props: Draggable.CollisionProvider.Props<CardPayload>;
void props.kind;

const dataKind = Draggable.createKind<{ id: string }, { offset: number }>('collision-data');
<Draggable.CollisionProvider
  kind={dataKind}
  onMoveStart={(eventDetails) => {
    expectType<{ offset: number } | undefined, typeof eventDetails.source.dragData>(
      eventDetails.source.dragData,
    );
  }}
/>;
