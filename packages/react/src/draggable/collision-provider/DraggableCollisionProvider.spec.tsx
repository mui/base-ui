import * as React from 'react';
import { expectType } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import type { DragEndReason, DropTargetChangeReason } from '@base-ui/react/draggable';

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
  onMoveStart={({ source }) => expectType<CardPayload, typeof source.payload>(source.payload)}
  onCollisionChange={({ collision, previousCollision }, details) => {
    if (collision) {
      expectType<CardPayload, typeof collision.target.payload>(collision.target.payload);
      const point = collision.target.getLocalPoint();
      expectType<number, typeof point.x>(point.x);
      const snapped = collision.target.getSnappedLocalPoint({ anchor: 'source' });
      expectType<number, typeof snapped.y>(snapped.y);
    }
    expectType<Draggable.CollisionProvider.Collision<CardPayload> | null, typeof previousCollision>(
      previousCollision,
    );
    expectType<DropTargetChangeReason, typeof details.reason>(details.reason);
  }}
  onMoveEnd={({ collision, canceled, dropTarget }, details) => {
    expectType<boolean, typeof canceled>(canceled);
    expectType<DragEndReason, typeof details.reason>(details.reason);
    if (collision) {
      expectType<CardPayload, typeof collision.target.payload>(collision.target.payload);
    }
    void dropTarget;
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
  onCollisionChange={({ collision }) => {
    if (collision) {
      expectType<undefined, typeof collision.target.payload>(collision.target.payload);
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
declare const collision: Draggable.CollisionProvider.Collision<CardPayload>;
expectType<CardPayload, typeof collision.target.payload>(collision.target.payload);
declare const collisionEvent: Draggable.CollisionProvider.CollisionEvent<CardPayload>;
expectType<
  Draggable.CollisionProvider.Collision<CardPayload> | null,
  typeof collisionEvent.collision
>(collisionEvent.collision);
declare const endEvent: Draggable.CollisionProvider.MoveEndEvent<CardPayload>;
expectType<boolean, typeof endEvent.canceled>(endEvent.canceled);
declare const props: Draggable.CollisionProvider.Props<CardPayload>;
void props.kind;

const dataKind = Draggable.createKind<{ id: string }, { offset: number }>('collision-data');
<Draggable.CollisionProvider
  kind={dataKind}
  onMoveStart={({ source }) => {
    expectType<{ offset: number } | undefined, typeof source.dragData>(source.dragData);
  }}
/>;
